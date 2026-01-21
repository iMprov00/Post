// Основные функции приложения

// Функция для получения опций для выпадающего списка
function getOptionsForField(field) {
    switch (field) {
        case 'room_number':
            return ['1', '2', '3', '4', '5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','ВИП1','ВИП2'];
        case 'child_location':
            return ['+', 'ДРО', 'ДО'];
        case 'table_number':
            return ['0', '1а','9','Щд'];
        case 'notes':
            return ['Кольпо','Лябио', 'Эпизио', 'ПЭ ум.', 'ПЭ тяж.', 'F70','ХАГ', 'ГАГ', 'эпизио', 'Туберкулез', 'СД I', 'СД II', 'Без оплаты', 'Шизофрения', 'Буркова', 'Баталина', 'Ремнева', 'Дурягина','Смолихина','Хабаров','Андрияхова','Тарасенко','Сафонова','Кобзева','Колядо'];
        default:
            return [];
    }
}


// Переключение видимости палаты
function toggleRoom(button, roomNumber) {
  const roomPatients = document.querySelectorAll(`.room-${roomNumber.replace(/\s+/g, '-').toLowerCase()}`);
  const roomHeader = button.closest('.room-header');
  const roomDivider = roomHeader.nextElementSibling?.classList.contains('room-divider') ? 
                     roomHeader.nextElementSibling : null;
  
  roomPatients.forEach(row => {
    if (row.style.display === 'none') {
      row.style.display = '';
      button.innerHTML = '<i class="bi bi-chevron-up"></i> Свернуть';
      button.classList.remove('btn-secondary');
      button.classList.add('btn-outline-secondary');
      roomHeader.classList.remove('room-collapsed');
      
      // Показываем разделитель если есть
      if (roomDivider) roomDivider.style.display = '';
    } else {
      row.style.display = 'none';
      button.innerHTML = '<i class="bi bi-chevron-down"></i> Развернуть';
      button.classList.remove('btn-outline-secondary');
      button.classList.add('btn-secondary');
      roomHeader.classList.add('room-collapsed');
      
      // Скрываем разделитель
      if (roomDivider) roomDivider.style.display = 'none';
    }
  });
}

// Фильтрация по палатам в реальном времени (опционально)
function setupRoomFilter() {
  const roomFilter = document.getElementById('roomFilter');
  if (!roomFilter) return;
  
  roomFilter.addEventListener('change', function() {
    const selectedRoom = this.value;
    const allPatients = document.querySelectorAll('.patient-row');
    const roomHeaders = document.querySelectorAll('.room-header');
    const roomDividers = document.querySelectorAll('.room-divider');
    
    if (!selectedRoom) {
      // Показать все палаты
      allPatients.forEach(row => row.style.display = '');
      roomHeaders.forEach(header => header.style.display = '');
      roomDividers.forEach(divider => divider.style.display = '');
      return;
    }
    
    // Скрыть все, затем показать только выбранную палату
    allPatients.forEach(row => {
      const rowRoom = row.getAttribute('data-room');
      if (rowRoom === selectedRoom) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
    
    // Показать/скрыть заголовки палат
    roomHeaders.forEach(header => {
      const headerText = header.textContent;
      if (headerText.includes(`Палата ${selectedRoom}`) || 
          (selectedRoom === '' && headerText.includes('Не указана'))) {
        header.style.display = '';
      } else {
        header.style.display = 'none';
      }
    });
    
    // Обновить счетчики
    updateStats();
  });
}

// Обновление статистики
function updateStats() {
  const visiblePatients = document.querySelectorAll('.patient-row[style*=""]').length;
  const totalPatients = document.querySelectorAll('.patient-row').length;
  const statsNumber = document.querySelector('.stats-number');
  
  if (statsNumber) {
    statsNumber.textContent = visiblePatients;
    
    // Показывать общее количество в скобках если не все видны
    const statsText = document.querySelector('.text-muted');
    if (visiblePatients !== totalPatients) {
      statsText.textContent = `пациентов (${visiblePatients} из ${totalPatients})`;
    } else {
      statsText.textContent = 'пациентов';
    }
  }
}

// Создание уникального ID для datalist
function generateDatalistId(patientId, field) {
    return `datalist-${patientId}-${field}`;
}

// Обновить поиск для работы с группировкой
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    const rows = document.querySelectorAll('.patient-row');
    let visibleCount = 0;
    
    rows.forEach(row => {
      let rowText = '';
      const cells = row.querySelectorAll('td.editable');
      
      cells.forEach(cell => {
        const cellContent = cell.querySelector('.cell-content');
        if (cellContent) {
          if (cell.dataset.field === 'is_foreigner' || cell.dataset.field === 'contract') {
            const searchText = cellContent.dataset.searchText || '';
            rowText += ' ' + searchText.toLowerCase();
          } else {
            rowText += ' ' + cellContent.textContent.toLowerCase();
          }
        }
      });
      
      if (searchTerm === '' || rowText.includes(searchTerm)) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    // Показать/скрыть заголовки пустых палат
    updateRoomHeadersVisibility();
    
    // Обновить статистику
    updateStats();
    
    // Показываем/скрываем сообщение "Ничего не найдено"
    const noResults = document.getElementById('noResults');
    const originalNoData = rows.length === 0;
    
    if (visibleCount === 0 && !originalNoData && searchTerm !== '') {
      if (noResults) noResults.style.display = 'block';
    } else {
      if (noResults) noResults.style.display = 'none';
    }
  });
}

// Показать/скрыть заголовки пустых палат
function updateRoomHeadersVisibility() {
  const roomHeaders = document.querySelectorAll('.room-header');
  
  roomHeaders.forEach(header => {
    const roomName = header.textContent.match(/Палата (.+?)\s/)?.[1] || '';
    const roomPatients = document.querySelectorAll(`.room-${roomName.replace(/\s+/g, '-').toLowerCase()}`);
    const visiblePatients = Array.from(roomPatients).filter(row => 
      row.style.display !== 'none'
    ).length;
    
    if (visiblePatients === 0) {
      header.style.display = 'none';
      // Скрыть разделитель если есть
      const nextDivider = header.nextElementSibling;
      if (nextDivider && nextDivider.classList.contains('room-divider')) {
        nextDivider.style.display = 'none';
      }
    } else {
      header.style.display = '';
      // Показать разделитель если есть
      const nextDivider = header.nextElementSibling;
      if (nextDivider && nextDivider.classList.contains('room-divider')) {
        nextDivider.style.display = '';
      }
    }
  });
}

// Редактирование ячеек таблицы
function setupTableEditing() {
    const patientsTable = document.getElementById('patientsTable');
    if (!patientsTable) return;
    
    // Обработчик клика для редактирования
    patientsTable.addEventListener('click', function(e) {
        const cell = e.target.closest('.editable');
        if (!cell || cell.classList.contains('editing')) return;
        
        const field = cell.dataset.field;
        
        // Для чекбоксов (иногородний и контракт) делаем мгновенное переключение
        if (field === 'is_foreigner' || field === 'contract') {
            const patientId = cell.closest('tr').dataset.patientId;
            const cellContent = cell.querySelector('.cell-content');
            
            let currentValue;
            if (field === 'is_foreigner') {
                // Проверяем наличие галочки по иконке
                const hasCheck = cellContent.querySelector('.bi-check-square');
                currentValue = hasCheck ? 'да' : 'нет';
                const newValue = currentValue === 'да' ? 'нет' : 'да';
                updateCheckboxField(patientId, field, newValue, cell);
            } else {
                // Для contract проверяем булево значение
                const hasCheck = cellContent.querySelector('.bi-check-square');
                currentValue = !!hasCheck; // Преобразуем в boolean
                const newValue = !currentValue;
                updateCheckboxField(patientId, field, newValue, cell);
            }
            return; // Не переходим в режим редактирования для чекбоксов
        }
        
        // Для остальных полей - обычное редактирование
        startEditing(cell);
    });
    
    // Обработчик нажатия Enter для сохранения
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.activeElement.classList.contains('editable-input')) {
            const input = document.activeElement;
            const cell = input.closest('.editable');
            if (cell) saveCell(cell, input.value);
        }
        
        // Отмена редактирования по Escape
        if (e.key === 'Escape' && document.activeElement.classList.contains('editable-input')) {
            const input = document.activeElement;
            const cell = input.closest('.editable');
            if (cell) cancelEditing(cell);
        }
    });
    
    // Сохранение при потере фокуса
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('editable-input')) {
            const cell = e.target.closest('.editable');
            if (cell) {
                setTimeout(() => {
                    if (!cell.contains(document.activeElement)) {
                        saveCell(cell, e.target.value);
                    }
                }, 10);
            }
        }
    }, true);
}

// Функция для обновления чекбокс-полей (иногородний и контракт)
function updateCheckboxField(patientId, field, value, cell) {
    // Показываем спиннер или индикатор загрузки
    const originalContent = cell.innerHTML;
    cell.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    
    fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCellContent(cell, data.patient[field], field);
        } else {
            showNotification('Ошибка сохранения: ' + (data.errors ? data.errors.join(', ') : 'Неизвестная ошибка'), 'error');
            // Восстанавливаем исходное содержимое
            cell.innerHTML = originalContent;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка сохранения', 'error');
        cell.innerHTML = originalContent;
    });
}

function startEditing(cell) {
    if (cell.classList.contains('editing')) return;
    
    const patientId = cell.closest('tr').dataset.patientId;
    const field = cell.dataset.field;
    const cellContent = cell.querySelector('.cell-content');
    let currentContent = '';
    
    if (cellContent) {
        currentContent = cellContent.textContent.trim();
        if (currentContent === '—') currentContent = '';
    }
    
    // Проверяем, не является ли поле чекбоксом (для чекбоксов у нас отдельная логика)
    if (field === 'is_foreigner' || field === 'contract') {
        return; // Для чекбоксов используем мгновенное переключение
    }
    
    cell.classList.add('editing');
    
    let inputHtml;
    const datalistId = generateDatalistId(patientId, field);
    
    // Определяем тип поля
    if (field === 'birth_date' || field === 'birth_date_of_child') {
        // Для дат используем специальный формат
        const dateValue = currentContent && currentContent !== '—' ? currentContent : '';
        inputHtml = `<input type="date" class="editable-input" value="${dateValue}" autofocus>`;
    } else if (field === 'thermometry_u' || field === 'thermometry_o' || field === 'thermometry_v') {
        // Для температуры используем специальное поле
        const tempValue = currentContent === '—' || currentContent === '' ? '36,6' : currentContent;
        inputHtml = `<input type="text" class="editable-input" value="${tempValue}" autofocus>`;
    } else if (field === 'child_location') {
        // Для "Где ребёнок" используем специальное поле с выпадающим списком
        const locationValue = currentContent === '—' || currentContent === '' ? '+' : currentContent;
        const options = getOptionsForField(field);
        inputHtml = `
            <input type="text" 
                   class="editable-input autocomplete-input" 
                   list="${datalistId}"
                   value="${locationValue}" 
                   autofocus
                   autocomplete="off">
            <datalist id="${datalistId}">
                ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
            </datalist>
        `;
    } else if (['room_number', 'table_number', 'notes'].includes(field)) {
        // Для палаты, стола и примечаний используем поле с выпадающим списком
        const fieldValue = currentContent === '—' ? '' : currentContent;
        const options = getOptionsForField(field);
        inputHtml = `
            <input type="text" 
                   class="editable-input autocomplete-input" 
                   list="${datalistId}"
                   value="${fieldValue}" 
                   autofocus
                   autocomplete="off">
            <datalist id="${datalistId}">
                ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
            </datalist>
        `;
    } else {
        // Для остальных полей обычный input
        inputHtml = `<input type="text" class="editable-input" value="${currentContent}" autofocus>`;
    }
    
    cell.innerHTML = inputHtml;
    
    // Автофокус на поле ввода
    const input = cell.querySelector('input');
    if (input) {
        input.focus();
        
        // Для текстовых полей выделяем весь текст
        if (input.type === 'text') {
            input.select();
            
            // Добавляем обработчик для фильтрации списка при вводе
            if (input.classList.contains('autocomplete-input')) {
                setupAutocompleteInput(input, field);
            }
        }
    }
}

// Настройка автодополнения для input
function setupAutocompleteInput(input, field) {
    const datalistId = input.getAttribute('list');
    const datalist = document.getElementById(datalistId);
    
    if (!datalist) return;
    
    // Сохраняем оригинальные опции
    const originalOptions = Array.from(datalist.querySelectorAll('option')).map(opt => opt.value);
    
    // Обработчик ввода для фильтрации списка
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase().trim();
        const options = getOptionsForField(field);
        
        // Очищаем datalist
        datalist.innerHTML = '';
        
        if (value === '') {
            // Если поле пустое, показываем все опции
            options.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                datalist.appendChild(optionEl);
            });
        } else {
            // Фильтруем опции по частичному совпадению
            const filteredOptions = options.filter(option => 
                option.toLowerCase().includes(value)
            );
            
            // Показываем отфильтрованные опции
            filteredOptions.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                datalist.appendChild(optionEl);
            });
            
            // Также добавляем текущее значение как опцию, если его нет в списке
            if (!options.includes(value) && value !== '') {
                const customOption = document.createElement('option');
                customOption.value = value;
                customOption.textContent = `(пользовательский ввод)`;
                customOption.dataset.custom = 'true';
                datalist.appendChild(customOption);
            }
        }
    });
    
    // При фокусе показываем все опции
    input.addEventListener('focus', function() {
        datalist.innerHTML = '';
        originalOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option;
            datalist.appendChild(optionEl);
        });
    });
}

function saveCell(cell, value) {
    const patientId = cell.closest('tr').dataset.patientId;
    const field = cell.dataset.field;
    
    // Пропускаем чекбоксные поля
    if (field === 'is_foreigner' || field === 'contract') {
        return;
    }
    
    // Если value не передан, берем из input
    if (value === undefined) {
        const input = cell.querySelector('input, select');
        if (input) value = input.value;
    }
    
    // Очищаем значение
    if (value === '—' || value === '') value = null;
    
    // Отправляем на сервер
    fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCellContent(cell, data.patient[field], field);
            updateSearchIndex(cell, data.patient[field]);
            
            // Показываем уведомление об успехе
            showNotification('Данные сохранены успешно!', 'success');
        } else {
            showNotification('Ошибка сохранения: ' + (data.errors ? data.errors.join(', ') : 'Неизвестная ошибка'), 'error');
            cancelEditing(cell);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка сохранения', 'error');
        cancelEditing(cell);
    });
}

function updateCellContent(cell, value, field) {
    let displayValue = '';
    let searchText = '';
    
    if (!value && value !== 0 && value !== false && value !== '') {
        displayValue = '—';
        searchText = '—';
    } else if ((field === 'birth_date' || field === 'birth_date_of_child') && value) {
        // Форматируем дату для отображения
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            displayValue = date.toISOString().split('T')[0]; // YYYY-MM-DD формат
            searchText = displayValue;
        } else {
            displayValue = value;
            searchText = value;
        }
    } else if (field === 'is_foreigner') {
        // Для иногороднего отображаем чекбокс
        if (value === 'да' || value === true) {
            displayValue = '<i class="bi bi-check-square"></i>';
            searchText = 'иногородний да';
        } else {
            displayValue = '<i class="bi bi-square"></i>';
            searchText = 'иногородний нет';
        }
    } else if (field === 'contract') {
        // Для контракта отображаем чекбокс
        if (value === true || value === 'true' || value === 'да') {
            displayValue = '<i class="bi bi-check-square"></i>';
            searchText = 'контракт да';
        } else {
            displayValue = '<i class="bi bi-square"></i>';
            searchText = 'контракт нет';
        }
    } else {
        displayValue = value;
        searchText = value;
    }
    
    cell.innerHTML = `<span class="cell-content" data-search-text="${searchText}">${displayValue}</span>`;
    cell.classList.remove('editing');
}

function updateSearchIndex(cell, value) {
    const cellContent = cell.querySelector('.cell-content');
    if (cellContent) {
        // Для полей, которые не являются чекбоксами
        if (!cell.dataset.field || (cell.dataset.field !== 'is_foreigner' && cell.dataset.field !== 'contract')) {
            cellContent.textContent = value || '—';
            cellContent.dataset.searchText = value || '—';
        }
    }
}

function cancelEditing(cell) {
    const patientId = cell.closest('tr').dataset.patientId;
    const field = cell.dataset.field;
    
    // Загружаем исходные данные с сервера
    fetch(`/api/patients/${patientId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateCellContent(cell, data.patient[field], field);
            } else {
                // Если не удалось загрузить, просто перезагружаем страницу
                location.reload();
            }
        })
        .catch(() => {
            location.reload();
        });
}

// Уведомления
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.app-notification');
    oldNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `app-notification alert alert-${type === 'error' ? 'danger' : type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 400px;
        animation: fadeIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>${message}</div>
            <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (notification.parentElement) notification.remove();
            }, 300);
        }
    }, 5000);
}

// Добавление пациента
function addPatient() {
    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
}

function saveNewPatient() {
    const form = document.getElementById('addPatientForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Обрабатываем чекбоксы
    data.is_foreigner = form.querySelector('#isForeignerCheck').checked ? 'да' : 'нет';
    data.contract = form.querySelector('#contractCheck').checked;
    
    // Устанавливаем значения по умолчанию
    if (!data.child_location || data.child_location.trim() === '') {
        data.child_location = '+';
    }
    if (!data.thermometry_u || data.thermometry_u.trim() === '') {
        data.thermometry_u = '36,6';
    }
    if (!data.thermometry_o || data.thermometry_o.trim() === '') {
        data.thermometry_o = '36,6';
    }
    if (!data.thermometry_v || data.thermometry_v.trim() === '') {
        data.thermometry_v = '36,6';
    }
    
    fetch('/api/patients', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Пациент успешно добавлен!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification('Ошибка: ' + (data.errors ? data.errors.join(', ') : 'Неизвестная ошибка'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка добавления пациента', 'error');
    });
}

// Удаление пациента
function deletePatient(id, name) {
    if (confirm(`Вы уверены, что хотите удалить пациента "${name}"?`)) {
        fetch(`/api/patients/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Пациент успешно удален!', 'success');
                document.getElementById(`patient-${id}`).remove();
                
                // Если таблица пустая, показываем сообщение
                if (document.querySelectorAll('#patientsTable tr.patient-row').length === 0) {
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                showNotification('Ошибка удаления', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка удаления', 'error');
        });
    }
}

// Инициализация экспорта
function setupExport() {
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Описания типов экспорта
    const exportDescriptions = {
        'Общий': `
            <div class="alert alert-warning fade-in">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Формат экспорта "Общий":</strong><br>
                • Название отделения и дата в объединенных ячейках<br>
                • Все ячейки с границами для печати<br>
                • Столбцы: № П, ФИО, Дата рождения, Где ребенок, Дата родов, Примечания, Иногородний, У t, О t, В t
            </div>`,
            
        'столовая': `
            <div class="alert alert-success fade-in">
                <i class="bi bi-people me-2"></i>
                <strong>Формат экспорта "Столовая":</strong><br>
                • Компактный формат с двумя параллельными таблицами<br>
                • Столбцы: № П, ФИО, Стол<br>
                • Оптимизировано для печати на листе А4<br>
                • Вмещает до 60+ пациентов на одной странице
            </div>`,
            
        'Буркова': `
            <div class="alert alert-info fade-in">
                <i class="bi bi-file-text me-2"></i>
                <strong>Формат экспорта "Буркова":</strong><br>
                • Специальный формат для отчетности Бурковой<br>
                • Столбцы: № П, ФИО, Дата родов, Примечания<br>
                • Альбомная ориентация страницы<br>
                • Все ячейки с границами для печати
            </div>`,
            
        'КПП': `
            <div class="alert alert-info fade-in">
                <i class="bi bi-shield-check me-2"></i>
                <strong>Формат экспорта "КПП":</strong><br>
                • Данные для контрольно-пропускного пункта<br>
                • Столбцы: № П (номер палаты), ФИО<br>
                • Компактный формат с двумя параллельными таблицами<br>
                • Оптимизировано для печати на листе А4<br>
                • Вмещает до 60+ пациентов на одной странице
            </div>`
    };
    
    // Функция для обновления описания
    function updateExportDescription(exportType) {
        const descriptionDiv = document.getElementById('exportDescription');
        if (descriptionDiv) {
            descriptionDiv.innerHTML = exportDescriptions[exportType] || '';
        }
    }
    
    // Обработка выбора типа экспорта
    const exportTypeSelect = document.querySelector('select[name="export_type"]');
    if (exportTypeSelect) {
        // Инициализация описания при загрузке
        const initialExportType = exportTypeSelect.value;
        updateExportDescription(initialExportType);
        
        // Обработка изменения
        exportTypeSelect.addEventListener('change', function(e) {
            updateExportDescription(e.target.value);
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  // Инициализация поиска
  setupSearch();
  
  // Инициализация редактирования таблицы
  setupTableEditing();
  
  // Инициализация экспорта
  setupExport();
  
  // Инициализация фильтра по палатам
  setupRoomFilter();
  
  // Автоматический фокус на поле поиска
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.focus();
  }
  
  // Добавляем анимацию для карточек
  document.querySelectorAll('.app-card, .control-panel').forEach(card => {
    card.classList.add('fade-in');
  });
  
  // Восстанавливаем состояние свернутых палат из localStorage
  restoreRoomStates();
});

// Сохранение состояния свернутых палат
function saveRoomState(roomNumber, isCollapsed) {
  const roomStates = JSON.parse(localStorage.getItem('roomStates') || '{}');
  roomStates[roomNumber] = isCollapsed;
  localStorage.setItem('roomStates', JSON.stringify(roomStates));
}

// Восстановление состояния свернутых палат
function restoreRoomStates() {
  const roomStates = JSON.parse(localStorage.getItem('roomStates') || '{}');
  
  Object.keys(roomStates).forEach(roomNumber => {
    if (roomStates[roomNumber]) {
      const button = document.querySelector(`button[onclick*="${roomNumber}"]`);
      if (button) {
        setTimeout(() => toggleRoom(button, roomNumber), 100);
      }
    }
  });
}

