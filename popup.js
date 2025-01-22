document.addEventListener('DOMContentLoaded', function() {
  loadProblems();
  
  document.getElementById('addProblem').addEventListener('click', function() {
    const problemId = document.getElementById('problemId').value;
    const problemName = document.getElementById('problemName').value;
    const revisionDays = document.getElementById('revisionDays').value;
    
    if (!problemId || !problemName || !revisionDays) {
      alert('Please fill in all fields');
      return;
    }
    
    addProblem({
      id: problemId,
      name: problemName,
      revisionDays: parseInt(revisionDays),
      dateAdded: new Date().toISOString(),
      nextRevision: new Date(Date.now() + (parseInt(revisionDays) * 24 * 60 * 60 * 1000)).toISOString(),
      completedRevisions: 0
    });
  });
});

function addProblem(problem) {
  chrome.storage.sync.get(['problems'], function(result) {
    const problems = result.problems || [];
    
    if (problems.length >= 5) {
      alert('Free version limited to 5 problems');
      return;
    }
    
    problems.push(problem);
    
    chrome.storage.sync.set({ problems: problems }, function() {
      loadProblems();
      clearInputs();
      setupAlarm(problem);
    });
  });
}

function loadProblems() {
  chrome.storage.sync.get(['problems'], function(result) {
    const problems = result.problems || [];
    const problemList = document.getElementById('problemList');
    problemList.innerHTML = '';
    
    updateProgressBanner(problems);
    updateStats(problems);
    
    problems.forEach(function(problem) {
      const needsRevision = new Date(problem.nextRevision) <= new Date();
      const div = document.createElement('div');
      div.className = 'problem-item';
      
      div.innerHTML = `
        <div class="problem-header">
          <a href="https://leetcode.com/problems/${problem.name.toLowerCase().replace(/\s+/g, '-')}/" 
             target="_blank" class="problem-link">
            #${problem.id} - ${problem.name}
          </a>
          <span class="badge badge-blue">
            Next: ${new Date(problem.nextRevision).toLocaleDateString()}
          </span>
        </div>
        <div class="problem-meta">
          Completed revisions: ${problem.completedRevisions} • 
          Added: ${new Date(problem.dateAdded).toLocaleDateString()}
        </div>
        <div>
          ${needsRevision ? 
            `<button class="completion-btn" data-id="${problem.id}">Mark Complete</button>` : 
            ''}
          <button class="delete-btn" data-id="${problem.id}">Delete</button>
        </div>
      `;
      
      problemList.appendChild(div);
    });
    
    // Add event listeners
    document.querySelectorAll('.completion-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        markRevisionComplete(this.dataset.id);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteProblem(this.dataset.id);
      });
    });
  });
}

function updateProgressBanner(problems) {
  const progressBanner = document.getElementById('progressBanner');
  const todaysRevisions = problems.filter(p => new Date(p.nextRevision) <= new Date()).length;

  if (todaysRevisions === 0) {
    progressBanner.className = 'progress-banner all-set';
    progressBanner.innerHTML = '&#x1F3AF; You\'re all set! No revisions pending for today!'; // 🎯
  } else {
    progressBanner.className = 'progress-banner pending-revisions';
    progressBanner.innerHTML = `&#x1F4DA; You have ${todaysRevisions} problem${todaysRevisions > 1 ? 's' : ''} to revise today!`; // 📚
  }
}


function updateStats(problems) {
  const totalRevisions = problems.reduce((sum, p) => sum + p.completedRevisions, 0);
  const avgRevisions = problems.length ? (totalRevisions / problems.length).toFixed(1) : '0.0';
  
  document.getElementById('totalProblems').textContent = problems.length;
  document.getElementById('totalRevisions').textContent = totalRevisions;
  document.getElementById('avgRevisions').textContent = avgRevisions;
}

function markRevisionComplete(problemId) {
  chrome.storage.sync.get(['problems'], function(result) {
    const problems = result.problems || [];
    const problem = problems.find(p => p.id === problemId);
    
    if (problem) {
      problem.completedRevisions++;
      problem.nextRevision = new Date(Date.now() + (problem.revisionDays * 24 * 60 * 60 * 1000)).toISOString();
      
      chrome.storage.sync.set({ problems: problems }, function() {
        loadProblems();
        setupAlarm(problem);
      });
    }
  });
}

function deleteProblem(problemId) {
  chrome.storage.sync.get(['problems'], function(result) {
    const problems = result.problems || [];
    const newProblems = problems.filter(p => p.id !== problemId);
    
    chrome.storage.sync.set({ problems: newProblems }, function() {
      loadProblems();
    });
  });
}

function setupAlarm(problem) {
  const alarmName = `problem-${problem.id}`;
  chrome.alarms.create(alarmName, {
    when: new Date(problem.nextRevision).getTime()
  });
}

function clearInputs() {
  document.getElementById('problemId').value = '';
  document.getElementById('problemName').value = '';
  document.getElementById('revisionDays').value = '';
}
