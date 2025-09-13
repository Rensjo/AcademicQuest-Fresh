// Data recovery utilities for handling corrupted localStorage data

export interface DataRecoveryOptions {
  tryRecovery?: boolean;
  resetAll?: boolean;
  resetSpecific?: string[];
}

export function clearAllData(): void {
  const keys = [
    'aq:settings',
    'aq:theme', 
    'aq:academic-plan',
    'aq:schedule',
    'aq:tasks',
    'aq:scholarships',
    'aq:textbooks',
    'aq:study-sessions',
    'aq:gamification',
    'aq:course-planner',
    'aq:notifications',
    'aq:sound-settings'
  ];
  
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
    }
  });
  
  // Clear any other aq: prefixed keys
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('aq:')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear aq: prefixed keys:', error);
  }
}

export function tryDataRecovery(): boolean {
  try {
    // Try to recover course planner data specifically
    const coursePlannerData = localStorage.getItem('aq:course-planner');
    if (coursePlannerData) {
      const parsed = JSON.parse(coursePlannerData);
      
      // Validate and fix the data structure
      if (parsed && typeof parsed === 'object') {
        const fixedData = {
          state: {
            byYearTerm: parsed.byYearTerm || {},
            selectedCourseId: parsed.selectedCourseId || undefined,
            selectedYearId: parsed.selectedYearId || undefined,
            selectedTermId: parsed.selectedTermId || undefined,
          },
          version: 1
        };
        
        // Validate each course in each year/term
        Object.keys(fixedData.state.byYearTerm).forEach(key => {
          const courses = fixedData.state.byYearTerm[key];
          if (!Array.isArray(courses)) {
            fixedData.state.byYearTerm[key] = [];
          } else {
            // Filter out invalid courses and fix valid ones
            fixedData.state.byYearTerm[key] = courses.filter(course => {
              return course && 
                     typeof course.id === 'string' && 
                     typeof course.title === 'string';
            }).map(course => ({
              ...course,
              // Ensure required fields exist
              code: course.code || '',
              title: course.title || 'Untitled Course',
              instructor: course.instructor || undefined,
              syllabusUrl: course.syllabusUrl || undefined,
              linkedSlotId: course.linkedSlotId || undefined,
              weeklyAttendance: course.weeklyAttendance || {},
              modules: Array.isArray(course.modules) ? course.modules : [{ id: `m_${Math.random().toString(36).slice(2, 8)}`, title: "M1", html: "" }],
              tasks: Array.isArray(course.tasks) ? course.tasks : [],
              folders: Array.isArray(course.folders) ? course.folders : [{ id: `fold_${Math.random().toString(36).slice(2, 8)}`, path: "root", files: [] }],
            }));
          }
        });
        
        // Save the fixed data back
        localStorage.setItem('aq:course-planner', JSON.stringify(fixedData));
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Data recovery failed:', error);
    return false;
  }
}

export function validateStoredData(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Check course planner data
    const coursePlannerData = localStorage.getItem('aq:course-planner');
    if (coursePlannerData) {
      const parsed = JSON.parse(coursePlannerData);
      if (!parsed || typeof parsed !== 'object') {
        errors.push('Course planner data is not a valid object');
      } else if (!parsed.byYearTerm || typeof parsed.byYearTerm !== 'object') {
        errors.push('Course planner byYearTerm is not a valid object');
      } else {
        // Validate each year/term
        Object.keys(parsed.byYearTerm).forEach(key => {
          const courses = parsed.byYearTerm[key];
          if (!Array.isArray(courses)) {
            errors.push(`Courses for ${key} is not an array`);
          } else {
            courses.forEach((course, index) => {
              if (!course || typeof course !== 'object') {
                errors.push(`Course ${index} in ${key} is not a valid object`);
              } else {
                if (typeof course.id !== 'string') {
                  errors.push(`Course ${index} in ${key} has invalid id`);
                }
                if (typeof course.title !== 'string') {
                  errors.push(`Course ${index} in ${key} has invalid title`);
                }
                if (!Array.isArray(course.modules)) {
                  errors.push(`Course ${index} in ${key} has invalid modules`);
                }
                if (!Array.isArray(course.tasks)) {
                  errors.push(`Course ${index} in ${key} has invalid tasks`);
                }
                if (!Array.isArray(course.folders)) {
                  errors.push(`Course ${index} in ${key} has invalid folders`);
                }
              }
            });
          }
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Failed to validate stored data: ${error}`);
    return {
      isValid: false,
      errors
    };
  }
}

export function createDataBackup(): string {
  const backup: Record<string, string> = {};
  
  try {
    const keys = [
      'aq:settings',
      'aq:theme', 
      'aq:academic-plan',
      'aq:schedule',
      'aq:tasks',
      'aq:scholarships',
      'aq:textbooks',
      'aq:study-sessions',
      'aq:gamification',
      'aq:course-planner',
      'aq:notifications',
      'aq:sound-settings'
    ];
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        backup[key] = value;
      }
    });
    
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Failed to create backup:', error);
    return '{}';
  }
}

export function restoreDataFromBackup(backupJson: string): boolean {
  try {
    const backup = JSON.parse(backupJson);
    
    Object.keys(backup).forEach(key => {
      if (key.startsWith('aq:')) {
        localStorage.setItem(key, backup[key]);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}
