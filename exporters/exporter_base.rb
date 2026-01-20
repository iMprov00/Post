# app/exporters/exporter_base.rb
require 'axlsx'

class ExporterBase
  attr_reader :patients, :department, :date, :export_type
  
  def initialize(patients, department, date, export_type)
    @patients = patients
    @department = department
    @date = date
    @export_type = export_type
  end
  
  def export
    raise NotImplementedError, "Subclasses must implement export method"
  end
  
  protected
  
  def department_full
    case @department
    when 'АФО'
      'Акушерское физиологическое отделение с совместным пребыванием матери и ребёнка'
    else
      @department
    end
  end
  
  def create_styles(workbook)
    styles = workbook.styles
    
    {
      title_style: styles.add_style(
        b: true,
        sz: 10,
        alignment: { horizontal: :center, vertical: :center, wrap_text: true }
      ),
      date_style: styles.add_style(
        b: true,
        sz: 10,
        alignment: { horizontal: :center, vertical: :center, wrap_text: true }
      ),
      header_style: styles.add_style(
        b: true,
        sz: 6,
        alignment: { horizontal: :center, vertical: :center, wrap_text: true },
        border: { style: :thin, color: '000000' },
        bg_color: 'E6E6E6'
      ),
      wrap_cell_style: styles.add_style(
        sz: 6,
        border: { style: :thin, color: '000000' },
        alignment: { horizontal: :left, vertical: :center, wrap_text: true }
      ),
      cell_style: styles.add_style(
        sz: 6,
        border: { style: :thin, color: '000000' },
        alignment: { horizontal: :center, vertical: :center }
      )
    }
  end
  
  def setup_page(sheet, orientation = :portrait)
    sheet.page_setup do |page_setup|
      page_setup.paper_size = 9  # A4
      page_setup.orientation = orientation
      page_setup.fit_to(width: 1, height: 1000)
      page_setup.scale = 85
    end
    
    sheet.page_margins do |margins|
      margins.left = 0.5
      margins.right = 0.5
      margins.top = 0.3
      margins.bottom = 0.3
      margins.header = 0.1
      margins.footer = 0.1
    end
    
    sheet.print_options do |print_options|
      print_options.horizontal_centered = true
    end
  end
end