chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name.startsWith('problem-')) {
      const problemId = alarm.name.split('-')[1];
      
      chrome.storage.sync.get(['problems'], function(result) {
        const problems = result.problems || [];
        const problem = problems.find(p => p.id === problemId);
        
        if (problem) {
          chrome.notifications.create('', {
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'LeetCode Revision Reminder',
            message: `Time to revise problem #${problem.id}: ${problem.name}`,
            priority: 2
          });
          
          // Update next revision date
          problem.nextRevision = new Date(Date.now() + (problem.revisionDays * 24 * 60 * 60 * 1000)).toISOString();
          chrome.storage.sync.set({ problems: problems });
          
          // Setup next alarm
          setupAlarm(problem);
        }
      });
    }
  });
  
  function setupAlarm(problem) {
    const alarmName = `problem-${problem.id}`;
    chrome.alarms.create(alarmName, {
      when: new Date(problem.nextRevision).getTime()
    });
  }