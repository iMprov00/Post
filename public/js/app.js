// Основные функции приложения

// Поиск по таблице
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
                    rowText += ' ' + cellContent.textContent.toLowerCase();
                }
            });
            
            if (searchTerm === '' || rowText.includes(searchTerm)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
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

// Редактирование ячеек таблицы
function setupTableEditing() {
    const patientsTable = document.getElementById('patientsTable');
    if (!patientsTable) return;
    
    // Обработчик клика для редактирования
    patientsTable.addEventListener('click', function(e) {
        const cell = e.target.closest('.editable');
        if (!cell || cell.classList.contains('editing')) return;
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
    
    cell.classList.add('editing');
    
    let inputHtml;
    
    // Определяем тип поля
    if (field === 'birth_date' || field === 'birth_date_of_child') {
        // Для дат используем специальный формат
        const dateValue = currentContent && currentContent !== '—' ? currentContent : '';
        inputHtml = `<input type="date" class="editable-input" value="${dateValue}" autofocus>`;
    } else if (field === 'is_foreigner') {
        // Для иногородних используем select
        inputHtml = `
            <select class="editable-input" autofocus>
                <option value="">—</option>
                <option value="да" ${currentContent === 'да' ? 'selected' : ''}>да</option>
                <option value="нет" ${currentContent === 'нет' ? 'selected' : ''}>нет</option>
            </select>
        `;
    } else {
        inputHtml = `<input type="text" class="editable-input" value="${currentContent}" autofocus>`;
    }
    
    cell.innerHTML = inputHtml;
    
    // Автофокус на поле ввода
    const input = cell.querySelector('input, select');
    if (input) {
        input.focus();
        if (input.type === 'text') input.select();
    }
}

function saveCell(cell, value) {
    const patientId = cell.closest('tr').dataset.patientId;
    const field = cell.dataset.field;
    
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
    
    if (!value && value !== 0 && value !== false) {
        displayValue = '—';
    } else if ((field === 'birth_date' || field === 'birth_date_of_child') && value) {
        // Форматируем дату для отображения
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            displayValue = date.toISOString().split('T')[0]; // YYYY-MM-DD формат
        } else {
            displayValue = value;
        }
    } else {
        displayValue = value;
    }
    
    cell.innerHTML = `<span class="cell-content">${displayValue}</span>`;
    cell.classList.remove('editing');
}

function updateSearchIndex(cell, value) {
    const cellContent = cell.querySelector('.cell-content');
    if (cellContent) {
        cellContent.textContent = value || '—';
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
    
    // Автоматический фокус на поле поиска
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }
    
    // Добавляем анимацию для карточек
    document.querySelectorAll('.app-card, .control-panel').forEach(card => {
        card.classList.add('fade-in');
    });
});