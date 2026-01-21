require 'sinatra'
require 'sinatra/activerecord'
require 'roo'
require 'json'
require 'date'
require 'fileutils'


Dir.glob(File.join(File.dirname(__FILE__), 'exporters', '*.rb')).each do |file|
  require file
end

# Настройки приложения
configure do
  # Создаем директорию для базы данных если её нет
  FileUtils.mkdir_p('db') unless Dir.exist?('db')
  
  # Конфигурация SQLite3
  set :database, {
    adapter: 'sqlite3',
    database: 'db/hospital.db',
    pool: 5,
    timeout: 5000
  }
  
  # Включим подробное логгирование
  enable :logging
  ActiveRecord::Base.logger = Logger.new(STDOUT) if development?
  set :public_folder, 'public'
  set :static, true
end

# Модель пациента
class Patient < ActiveRecord::Base
  validates :full_name, :birth_date, :birth_date_of_child, presence: true
  
  scope :by_date_and_department, ->(date, department) { 
    where(registration_date: date, department: department) 
  }
  
  scope :by_previous_day_and_department, ->(date, department) {
    previous_date = date.is_a?(String) ? Date.parse(date) - 1 : date - 1
    where(registration_date: previous_date, department: department)
  }
  
def self.find_previous_patient(patient_data, department, date)
  puts "=" * 40
  puts "find_previous_patient вызван!"
  puts "  ФИО: #{patient_data[:full_name]}"
  puts "  Дата рождения: #{patient_data[:birth_date]}"
  puts "  Дата родов: #{patient_data[:birth_date_of_child]}"
  puts "  Отделение: #{department}"
  
  previous_date = date.is_a?(String) ? Date.parse(date) - 1 : date - 1
  puts "  Предыдущая дата: #{previous_date}"
  
  # Проверяем, есть ли данные за предыдущую дату
  puts "  Проверяем наличие данных за предыдущую дату..."
  count_previous = Patient.where(department: department, registration_date: previous_date).count
  puts "  Всего пациентов за предыдущий день: #{count_previous}"
  
  # Ищем пациента на предыдущий день
  previous_patient = Patient.where(
    full_name: patient_data[:full_name],
    birth_date: patient_data[:birth_date],
    birth_date_of_child: patient_data[:birth_date_of_child],
    department: department,
    registration_date: previous_date
  ).first
  
  if previous_patient
    puts "  Найден пациент на предыдущий день: ID=#{previous_patient.id}"
    puts "  Данные пациента:"
    puts "    child_location: #{previous_patient.child_location}"
    puts "    thermometry_u: #{previous_patient.thermometry_u}"
    puts "    thermometry_o: #{previous_patient.thermometry_o}"
    puts "    thermometry_v: #{previous_patient.thermometry_v}"
    puts "    table_number: #{previous_patient.table_number}"
    puts "    is_foreigner: #{previous_patient.is_foreigner}"
    puts "    notes: #{previous_patient.notes}"
  else
    puts "  Пациент на предыдущий день не найден"
    puts "  Причина: нет совпадения по ФИО и датам"
  end
  
  puts "=" * 40
  previous_patient
end
  
  def self.copy_data_from_previous_day(patient_data, previous_patient)
    puts "Копирование данных из предыдущего дня для пациента #{patient_data[:full_name]}"
    
    # Определяем поля, которые НЕ нужно копировать
    fields_to_exclude = [
      :room_number,             # Палата (оставляем из Excel)
      :full_name,               # ФИО (оставляем из Excel)
      :birth_date,              # Дата рождения (оставляем из Excel)
      :birth_date_of_child,     # Дата родов (оставляем из Excel)
      :department,              # Отделение (оставляем текущее)
      :registration_date,       # Дата регистрации (оставляем текущую)
      :created_at, :updated_at, # Временные метки
      :id                       # ID
    ]
    
    # Копируем все атрибуты из предыдущего пациента, кроме исключенных
    previous_patient.attributes.each do |key, value|
      next if fields_to_exclude.include?(key.to_sym)
      
      # Убедимся, что поле существует в patient_data
      if patient_data.key?(key.to_sym)
        puts "  Копируем поле #{key}: #{value}"
        patient_data[key.to_sym] = value
      else
        puts "  Пропускаем поле #{key} (не существует в базовой структуре)"
      end
    end
    
    patient_data
  end
  
  def self.import_from_excel(file_path, department, date)
    puts "=" * 50
    puts "Начинаем импорт из файла: #{file_path}"
    puts "Отделение: #{department}, Дата: #{date}"
    puts "=" * 50
    
    begin
      workbook = Roo::Excelx.new(file_path)
      puts "Файл успешно открыт"
      puts "Всего строк в файле: #{workbook.last_row}"
      
      patients_data = []
      
      # Начинаем с 5-й строки (A5, B5, C5, J5)
      (5..workbook.last_row).each do |row|
        room_number = workbook.cell(row, 1)
        full_name = workbook.cell(row, 2)
        birth_date = workbook.cell(row, 3)
        birth_date_of_child = workbook.cell(row, 10)
        
        puts "\nСтрока #{row}:"
        puts "  Палата: #{room_number.inspect}"
        puts "  ФИО: #{full_name.inspect}"
        puts "  Дата рождения: #{birth_date.inspect}"
        puts "  Дата родов: #{birth_date_of_child.inspect}"
        
        # Пропускаем пустые строки
        if room_number.nil? && full_name.nil? && birth_date.nil? && birth_date_of_child.nil?
          puts "  -> Пропускаем (все поля пустые)"
          next
        end
        
        # Обработка дат
        begin
          parsed_birth_date = birth_date.is_a?(Date) ? birth_date : Date.parse(birth_date.to_s)
        rescue => e
          puts "  Ошибка парсинга даты рождения #{birth_date}: #{e.message}"
          parsed_birth_date = nil
        end
        
        begin
          parsed_birth_date_of_child = birth_date_of_child.is_a?(Date) ? birth_date_of_child : Date.parse(birth_date_of_child.to_s)
        rescue => e
          puts "  Ошибка парсинга даты родов #{birth_date_of_child}: #{e.message}"
          parsed_birth_date_of_child = nil
        end
        
        # Базовые данные из Excel с значениями по умолчанию
        patient_data = {
          room_number: room_number.to_s.strip,
          full_name: full_name.to_s.strip,
          birth_date: parsed_birth_date,
          birth_date_of_child: parsed_birth_date_of_child,
          department: department,
          registration_date: date,
          created_at: Time.now,
          updated_at: Time.now,
          # Значения по умолчанию
          child_location: "+",                    # По умолчанию "+"
          thermometry_u: "36,6",                  # По умолчанию "36,6"
          thermometry_o: "36,6",                  # По умолчанию "36,6"
          thermometry_v: "36,6",                  # По умолчанию "36,6"
          table_number: nil,
          is_foreigner: "нет",                    # По умолчанию "нет"
          contract: false,                        # По умолчанию false (галочка снята)
          notes: nil
        }
        
        puts "  Ищем пациента на предыдущий день..."
        # Ищем пациента на предыдущий день
        previous_patient = find_previous_patient(patient_data, department, date)
        
        # Если нашли пациента на предыдущий день, копируем данные
        if previous_patient
          puts "  Копируем данные из предыдущего дня..."
          patient_data = copy_data_from_previous_day(patient_data, previous_patient)
        else
          puts "  Данные из предыдущего дня не будут скопированы"
        end
        
        puts "  -> Данные для сохранения: #{patient_data}"
        
        patients_data << patient_data
      end
      
      puts "\nИтого найдено записей: #{patients_data.size}"
      
      if patients_data.empty?
        puts "Нет данных для импорта!"
        return
      end
      
      # Удаляем старые записи за эту дату и отделение
      puts "Удаляем старые записи..."
      deleted_count = Patient.where(department: department, registration_date: date).delete_all
      puts "Удалено записей: #{deleted_count}"
      
      # Массовая вставка
      puts "Начинаем массовую вставку..."
      if patients_data.any?
        # Проверяем, что у всех объектов одинаковые ключи
        first_keys = patients_data.first.keys
        patients_data.each_with_index do |data, index|
          unless data.keys == first_keys
            puts "Ошибка: разные ключи у элемента #{index}:"
            puts "Ожидаемые: #{first_keys}"
            puts "Полученные: #{data.keys}"
            raise "Разные ключи у элементов массива"
          end
        end
        
        result = Patient.insert_all(patients_data)
        puts "Добавлено записей: #{result.count}"
      else
        puts "Нет данных для вставки"
      end
      
      puts "=" * 50
      puts "Импорт завершен!"
      puts "=" * 50
      
    rescue => e
      puts "ОШИБКА при импорте: #{e.message}"
      puts e.backtrace.join("\n")
      raise e
    end
  end
end

# Главная страница
# app.rb - обновите метод get '/'

get '/' do
  @departments = [
    { short: 'АФО', full: 'Акушерское физиологическое отделение с совместным пребыванием матери и ребёнка' }
  ]
  @selected_date = params[:date] || Date.today.to_s
  @selected_department = params[:department] || 'АФО'
  @selected_room = params[:room] || ''
  
  if params[:date] && params[:department]
    @patients = if @selected_room.present?
      Patient.by_date_and_department(params[:date], params[:department])
             .where(room_number: @selected_room)
             .order(:room_number, :id)
    else
      Patient.by_date_and_department(params[:date], params[:department])
             .order(:room_number, :id)
    end
    
    # Получаем уникальные палаты для фильтра
    @rooms = @patients.pluck(:room_number).uniq.compact.reject(&:empty?)
    # Сортируем палаты
    @rooms.sort_by! do |room|
      if room =~ /^\d+$/
        [0, room.to_i]
      elsif room =~ /^\d+[а-яa-z]?$/i
        num = room.to_i
        suffix = room.gsub(/\d+/, '')
        [1, num, suffix.downcase]
      else
        [2, room.downcase]
      end
    end
  else
    @patients = []
    @rooms = []
  end
  
  erb :index
end

# Страница загрузки файла
get '/upload' do
  @departments = [
    { short: 'АФО', full: 'Акушерское физиологическое отделение с совместным пребыванием матери и ребёнка' }
  ]
  erb :upload
end

# Загрузка Excel файла
post '/upload' do
  department = params[:department]
  date = params[:date]
  
  puts "POST /upload received"
  puts "Department: #{department}"
  puts "Date: #{date}"
  puts "File present: #{params[:file] ? 'YES' : 'NO'}"
  
  if params[:file] && params[:file][:tempfile]
    puts "Temp file path: #{params[:file][:tempfile].path}"
    puts "Temp file size: #{params[:file][:tempfile].size} bytes"
    
    # Проверяем, есть ли уже данные за эту дату
    existing_patients = Patient.by_date_and_department(date, department)
    puts "Existing patients count: #{existing_patients.count}"
    
    if existing_patients.any? && params[:overwrite] != 'true'
      # Перенаправляем на страницу подтверждения
      puts "Redirecting to confirm_overwrite..."
      redirect "/confirm_overwrite?department=#{department}&date=#{date}"
    end
    
    # Импорт данных
    puts "Starting import..."
    Patient.import_from_excel(params[:file][:tempfile].path, department, date)
    
    puts "Import completed, redirecting to main page..."
    redirect "/?department=#{department}&date=#{date}&success=true"
  else
    puts "No file provided or file error"
    redirect "/upload?error=no_file"
  end
end

# Страница подтверждения перезаписи
get '/confirm_overwrite' do
  @department = params[:department]
  @date = params[:date]
  @existing_count = Patient.by_date_and_department(@date, @department).count
  
  erb :confirm_overwrite
end

# API для получения пациентов
get '/api/patients' do
  content_type :json
  
  patients = Patient.where(
    department: params[:department],
    registration_date: params[:date]
  ).order(:id)
  
  patients.to_json
end

# API для получения данных одного пациента
get '/api/patients/:id' do
  content_type :json
  
  patient = Patient.find(params[:id])
  
  if patient
    { success: true, patient: patient.as_json }.to_json
  else
    status 404
    { success: false, error: 'Пациент не найден' }.to_json
  end
end

# API для обновления пациента
put '/api/patients/:id' do
  content_type :json
  
  patient = Patient.find(params[:id])
  data = JSON.parse(request.body.read)
  
  if patient.update(data)
    { success: true, patient: patient.as_json }.to_json
  else
    status 400
    { success: false, errors: patient.errors.full_messages }.to_json
  end
end

# API для удаления пациента
delete '/api/patients/:id' do
  content_type :json
  
  patient = Patient.find(params[:id])
  
  if patient.destroy
    { success: true }.to_json
  else
    status 400
    { success: false }.to_json
  end
end

# API для добавления пациента
post '/api/patients' do
  content_type :json
  data = JSON.parse(request.body.read)
  
  patient = Patient.new(data)
  
  if patient.save
    { success: true, patient: patient.as_json }.to_json
  else
    status 400
    { success: false, errors: patient.errors.full_messages }.to_json
  end
end

# Выгрузка данных
get '/export' do
  @export_types = ExporterFactory.available_types
  erb :export
end

post '/export_data' do
  # Здесь будет логика выгрузки в разных форматах
  # Пока просто заглушка
  redirect "/?message=Выгрузка%20в%20разработке"
end

# Экспорт данных в Excel
get '/export_excel' do
  department = params[:department]
  date = params[:date]
  export_type = params[:export_type] || 'Общий'
  
  puts "Экспорт данных:"
  puts "Отделение: #{department}"
  puts "Дата: #{date}"
  puts "Тип: #{export_type}"
  
  # Получаем пациентов за указанную дату и отделение
  patients = Patient.where(department: department, registration_date: date).order(:id)
  
  puts "Найдено пациентов: #{patients.count}"
  
  # Используем фабрику для создания экспортера
  exporter = ExporterFactory.create(export_type, patients, department, date)
  
  # Получаем пакет Excel
  package = exporter.export
  
  # Определяем имя файла
  filename = case export_type
             when 'столовая'
               "Столовая_#{department}_#{date}.xlsx"
             when 'Буркова'
               "Буркова_#{department}_#{date}.xlsx"
             when 'КПП'
               "КПП_#{department}_#{date}.xlsx"
             else
               "Пациенты_#{department}_#{date}.xlsx"
             end
  
  # Отправляем файл пользователю
  content_type 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  attachment filename
  
  # Возвращаем содержимое файла
  package.to_stream.read
end


# app.rb - добавить после класса Patient или перед главной страницей

# API для получения уникальных палат за дату и отделение
get '/api/rooms' do
  content_type :json
  
  patients = Patient.where(
    department: params[:department],
    registration_date: params[:date]
  )
  
  # Получаем уникальные номера палат, отсортированные естественным образом
  rooms = patients.pluck(:room_number).uniq.compact.reject(&:empty?)
  
  # Сортируем палаты: сначала цифры, потом текст
  sorted_rooms = rooms.sort_by do |room|
    if room =~ /^\d+$/
      [0, room.to_i] # Числа в начале
    elsif room =~ /^\d+[а-яa-z]?$/i
      num = room.to_i
      suffix = room.gsub(/\d+/, '')
      [1, num, suffix.downcase] # Числа с буквами
    else
      [2, room.downcase] # Текст в конце
    end
  end
  
  { rooms: sorted_rooms }.to_json
end

# API для получения пациентов по палате
get '/api/patients/by_room/:room' do
  content_type :json
  
  patients = Patient.where(
    department: params[:department],
    registration_date: params[:date],
    room_number: params[:room]
  ).order(:id)
  
  patients.to_json
end