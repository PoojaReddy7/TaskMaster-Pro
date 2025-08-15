document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const prioritySelect = document.getElementById('priority-select');
    const dueDateInput = document.getElementById('due-date');
    const categoryInput = document.getElementById('category-input');
    const searchInput = document.getElementById('search-input');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const undoBtn = document.getElementById('undo-btn');
    const speechInputBtn = document.getElementById('speech-input-btn');
    const speechSearchBtn = document.getElementById('speech-search-btn');

    // Task recovery variables
    let deletedTask = null;
    let undoTimeout = null;

    // Load tasks from localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            taskList.innerHTML = savedTasks;
            addTaskEventListeners();
            updateStats();
        }
    }

    // Add event listeners to all task items
    function addTaskEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteTask);
        });
        
        document.querySelectorAll('.task-item').forEach(task => {
            task.addEventListener('click', toggleTaskCompletion);
        });
    }

    // Add new task
    function addTask(e) {
        e.preventDefault();
        
        const taskText = taskInput.value.trim();
        if (!taskText) {
            showError("Task cannot be empty!");
            return;
        }
        
        clearError();
        
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;
        const category = categoryInput.value.trim();
        
        const li = document.createElement('li');
        li.className = `task-item ${priority}-priority`;
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskTitle = document.createElement('span');
        taskTitle.className = 'task-title';
        taskTitle.textContent = taskText;
        
        const taskMeta = document.createElement('div');
        taskMeta.className = 'task-meta';
        
        if (category) {
            const categorySpan = document.createElement('span');
            categorySpan.className = 'task-category';
            categorySpan.textContent = category;
            taskMeta.appendChild(categorySpan);
        }
        
        if (dueDate) {
            const dateSpan = document.createElement('span');
            dateSpan.className = 'task-date';
            dateSpan.textContent = formatDate(dueDate);
            taskMeta.appendChild(dateSpan);
        }
        
        taskContent.appendChild(taskTitle);
        taskContent.appendChild(taskMeta);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        li.appendChild(taskContent);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
        
        // Add pulse animation to new task
        li.style.animation = 'taskPulse 0.6s ease-out';
        
        // Reset form
        taskInput.value = "";
        categoryInput.value = "";
        dueDateInput.value = "";
        prioritySelect.value = "medium";
        
        // Add event listeners to new task
        deleteBtn.addEventListener('click', deleteTask);
        li.addEventListener('click', toggleTaskCompletion);
        
        saveTasks();
    }

    // Delete task with undo capability
    function deleteTask(e) {
        e.stopPropagation();
        const taskItem = e.target.closest('.task-item');
        
        // Store deleted task for possible undo
        deletedTask = {
            element: taskItem,
            html: taskItem.outerHTML,
            position: Array.from(taskItem.parentNode.children).indexOf(taskItem)
        };
        
        taskItem.remove();
        saveTasks();
        
        // Enable undo button for 7 seconds
        undoBtn.disabled = false;
        clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => {
            deletedTask = null;
            undoBtn.disabled = true;
        }, 7000);
    }

    // Undo delete functionality
    undoBtn.addEventListener('click', () => {
        if (deletedTask) {
            if (deletedTask.position >= taskList.children.length) {
                // If was last item, just append
                taskList.insertAdjacentHTML('beforeend', deletedTask.html);
            } else {
                // Insert at original position
                const referenceNode = taskList.children[deletedTask.position];
                referenceNode.insertAdjacentHTML('beforebegin', deletedTask.html);
            }
            
            // Reattach event listeners
            const restoredTask = deletedTask.position >= taskList.children.length 
                ? taskList.lastElementChild
                : taskList.children[deletedTask.position];
                
            restoredTask.querySelector('.delete-btn').addEventListener('click', deleteTask);
            restoredTask.addEventListener('click', toggleTaskCompletion);
            
            // Add animation to restored task
            restoredTask.style.animation = 'taskPulse 0.6s ease-out';
            
            deletedTask = null;
            undoBtn.disabled = true;
            clearTimeout(undoTimeout);
            saveTasks();
        }
    });

    // Toggle task completion
    function toggleTaskCompletion(e) {
        // Don't toggle if clicking on delete button
        if (e.target.classList.contains('delete-btn') || 
            e.target.closest('.delete-btn')) {
            return;
        }
        
        const taskItem = e.currentTarget;
        taskItem.classList.toggle('checked');
        saveTasks();
    }

    // Format date as MM/DD/YYYY
    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }

    // Update task statistics
    function updateStats() {
        const totalTasks = taskList.children.length;
        const completedTasks = taskList.querySelectorAll('.checked').length;
        const pendingTasks = totalTasks - completedTasks;
        
        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;
    }

    // Filter tasks based on search
    function filterTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        const tasks = taskList.querySelectorAll('.task-item');
        
        tasks.forEach(task => {
            const text = task.textContent.toLowerCase();
            task.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    // Show error message
    function showError(message) {
        // Remove any existing error first
        clearError();
        
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(errorElement);
        
        // Remove after 3 seconds with animation
        setTimeout(() => {
            errorElement.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                errorElement.remove();
            }, 300);
        }, 3000);
    }

    // Clear error message
    function clearError() {
        const errorElement = document.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', taskList.innerHTML);
        updateStats();
    }

    // Initialize speech recognition
    function initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            speechInputBtn.style.display = 'none';
            speechSearchBtn.style.display = 'none';
            showError("Speech recognition not supported in your browser");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        let currentTarget = null;

        // Function to handle speech results
        function handleSpeechResult(event) {
            let transcript = event.results[0][0].transcript.trim();
            
            // Remove trailing period if it exists
            if (transcript.endsWith('.')) {
                transcript = transcript.slice(0, -1);
            }
            
            if (currentTarget === 'task') {
                taskInput.value = transcript;
            } else if (currentTarget === 'search') {
                searchInput.value = transcript;
                filterTasks();
            }
            
            // Remove listening class from both buttons
            speechInputBtn.classList.remove('listening');
            speechSearchBtn.classList.remove('listening');
        }

        // Function to handle speech errors
        function handleSpeechError(event) {
            console.error('Speech recognition error', event.error);
            showError("Speech recognition error: " + event.error);
            
            speechInputBtn.classList.remove('listening');
            speechSearchBtn.classList.remove('listening');
        }

        // Task input speech button
        speechInputBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            currentTarget = 'task';
            speechInputBtn.classList.add('listening');
            speechSearchBtn.classList.remove('listening');
            
            try {
                recognition.start();
            } catch (error) {
                showError("Error starting speech recognition: " + error.message);
            }
        });

        // Search speech button
        speechSearchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            currentTarget = 'search';
            speechSearchBtn.classList.add('listening');
            speechInputBtn.classList.remove('listening');
            
            try {
                recognition.start();
            } catch (error) {
                showError("Error starting speech recognition: " + error.message);
            }
        });

        // Event listeners for speech recognition
        recognition.addEventListener('result', handleSpeechResult);
        recognition.addEventListener('error', handleSpeechError);
        recognition.addEventListener('end', function() {
            speechInputBtn.classList.remove('listening');
            speechSearchBtn.classList.remove('listening');
        });
    }

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    
    // Add task on Enter key press
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask(e);
        }
    });
    
    searchInput.addEventListener('input', filterTasks);
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
    dueDateInput.value = today; // Set default to today

    // Form submission
    document.querySelector('.task-input-section').addEventListener('submit', function(e) {
        e.preventDefault();
        addTask(e);
    });

    // Initialize speech recognition
    initializeSpeechRecognition();

    // Initial load
    loadTasks();
});

document.addEventListener('DOMContentLoaded', function() {
    // [Previous code remains the same until the addTask function]

    // Add new task
    function addTask(e) {
        e.preventDefault();
        
        const taskText = taskInput.value.trim();
        if (!taskText) {
            showError("Task cannot be empty!");
            return;
        }
        
        clearError();
        
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;
        const category = categoryInput.value.trim();
        
        const li = document.createElement('li');
        li.className = `task-item ${priority}-priority`;
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskTitle = document.createElement('span');
        taskTitle.className = 'task-title';
        taskTitle.textContent = taskText;
        
        const taskMeta = document.createElement('div');
        taskMeta.className = 'task-meta';
        
        if (category) {
            const categorySpan = document.createElement('span');
            categorySpan.className = 'task-category';
            categorySpan.textContent = category;
            taskMeta.appendChild(categorySpan);
        }
        
        if (dueDate) {
            const dateSpan = document.createElement('span');
            dateSpan.className = 'task-date';
            const formattedDate = formatDate(dueDate);
            dateSpan.textContent = formattedDate;
            
            // Add deadline status
            const deadlineStatus = document.createElement('span');
            deadlineStatus.className = 'deadline-status';
            updateDeadlineStatus(deadlineStatus, dueDate);
            
            taskMeta.appendChild(dateSpan);
            taskMeta.appendChild(deadlineStatus);
        }
        
        taskContent.appendChild(taskTitle);
        taskContent.appendChild(taskMeta);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        li.appendChild(taskContent);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
        
        // Add pulse animation to new task
        li.style.animation = 'taskPulse 0.6s ease-out';
        
        // Reset form
        taskInput.value = "";
        categoryInput.value = "";
        dueDateInput.value = "";
        prioritySelect.value = "medium";
        
        // Add event listeners to new task
        deleteBtn.addEventListener('click', deleteTask);
        li.addEventListener('click', toggleTaskCompletion);
        
        saveTasks();
    }

    // Function to update deadline status
    function updateDeadlineStatus(element, dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        
        if (due < today) {
            element.textContent = ' (Deadline passed)';
            element.style.color = '#f5365c';
            element.style.fontWeight = 'bold';
        } else {
            element.textContent = ' (Deadline active)';
            element.style.color = '#2dce89';
        }
    }

    // [Rest of the code remains the same]

    // Update the loadTasks function to include deadline status
    function loadTasks() {
        const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        taskList.innerHTML = '';
        
        savedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.priority}-priority`;
            if (task.completed) {
                li.classList.add('checked');
            }
            
            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            
            const taskTitle = document.createElement('span');
            taskTitle.className = 'task-title';
            taskTitle.textContent = task.text;
            
            const taskMeta = document.createElement('div');
            taskMeta.className = 'task-meta';
            
            if (task.category) {
                const categorySpan = document.createElement('span');
                categorySpan.className = 'task-category';
                categorySpan.textContent = task.category;
                taskMeta.appendChild(categorySpan);
            }
            
            if (task.dueDate) {
                const dateSpan = document.createElement('span');
                dateSpan.className = 'task-date';
                dateSpan.textContent = task.dueDate;
                
                const deadlineStatus = document.createElement('span');
                deadlineStatus.className = 'deadline-status';
                updateDeadlineStatus(deadlineStatus, new Date(task.dueDate).toISOString().split('T')[0]);
                
                taskMeta.appendChild(dateSpan);
                taskMeta.appendChild(deadlineStatus);
            }
            
            taskContent.appendChild(taskTitle);
            taskContent.appendChild(taskMeta);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            
            li.appendChild(taskContent);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
        
        addTaskEventListeners();
        updateStats();
    }

    // [Rest of the code remains the same]
});