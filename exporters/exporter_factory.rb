# app/exporters/exporter_factory.rb
class ExporterFactory
  EXPORTERS = {
    'Общий' => :GeneralExporter,
    'столовая' => :CanteenExporter,
    'Буркова' => :BurkovaExporter,
    'КПП' => :KPPExporter
  }.freeze
  
  def self.create(export_type, patients, department, date)
    # Загружаем базовый класс
    require_relative 'exporter_base'
    
    exporter_class_name = EXPORTERS[export_type] || :GeneralExporter
    
    # Загружаем конкретный экспортер
    case exporter_class_name
    when :GeneralExporter
      require_relative 'general_exporter'
      GeneralExporter.new(patients, department, date, export_type)
    when :CanteenExporter
      require_relative 'canteen_exporter'
      CanteenExporter.new(patients, department, date, export_type)
    when :BurkovaExporter
      require_relative 'burkova_exporter'
      BurkovaExporter.new(patients, department, date, export_type)
    when :KPPExporter
      require_relative 'kpp_exporter'
      KPPExporter.new(patients, department, date, export_type)
    else
      require_relative 'general_exporter'
      GeneralExporter.new(patients, department, date, export_type)
    end
  end
  
  def self.available_types
    EXPORTERS.keys
  end
end