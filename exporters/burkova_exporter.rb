# app/exporters/burkova_exporter.rb
require_relative 'exporter_base'

class BurkovaExporter < ExporterBase
  def export
    package = Axlsx::Package.new
    workbook = package.workbook
    
    styles = create_styles(workbook)
    
    workbook.add_worksheet(name: 'Буркова') do |sheet|
      setup_page(sheet, :landscape)
      
      sheet.merge_cells("A1:J1")
      sheet.add_row ["Формат Буркова - В РАЗРАБОТКЕ"], style: styles[:title_style]
      sheet.rows[0].height = 25
      
      sheet.merge_cells("A2:J2")
      sheet.add_row ["Отделение: #{department_full}, Дата: #{@date}"], style: styles[:date_style]
      sheet.rows[1].height = 20
      
      sheet.add_row ["", "", "", "", "", "", "", "", "", ""], style: styles[:header_style]
      sheet.rows[2].height = 25
      
      sheet.add_row ["Функционал экспорта в формате 'Буркова' находится в разработке."], style: styles[:wrap_cell_style]
      
      sheet.column_widths 15, 15, 15, 15, 15, 15, 15, 15, 15, 15
    end
    
    package
  end
end