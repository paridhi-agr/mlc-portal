export function getAssignmentStatus(dueDate, submissionReceivedDate) {
    const now = new Date();
  
    // No submission yet → maybe overdue
    if (!submissionReceivedDate) {
      if (now > dueDate) return 'overdue';
      return 'assigned';
    }
  
    // Submission exists → graded or late
    if (submissionReceivedDate <= dueDate) return 'graded';
  
    return 'late_submission';
  }