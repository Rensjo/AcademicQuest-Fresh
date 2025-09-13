import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Trash2, Download } from 'lucide-react';
import { clearAllData, tryDataRecovery, validateStoredData, createDataBackup } from '@/lib/dataRecovery';

interface DataErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showRecoveryDialog: boolean;
  recoveryAttempted: boolean;
}

interface DataErrorBoundaryProps {
  children: React.ReactNode;
}

export class DataErrorBoundary extends React.Component<DataErrorBoundaryProps, DataErrorBoundaryState> {
  constructor(props: DataErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showRecoveryDialog: false,
      recoveryAttempted: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DataErrorBoundaryState> {
    // Check if this is a data-related error
    const isDataError = error.message.includes('localStorage') || 
                       error.message.includes('JSON') ||
                       error.message.includes('course') ||
                       error.message.includes('persist');
    
    if (isDataError) {
      return {
        hasError: true,
        error,
        showRecoveryDialog: true,
      };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DataErrorBoundary caught an error:', error, errorInfo);
    
    // Check if this is a data corruption issue
    const validation = validateStoredData();
    if (!validation.isValid) {
      console.error('Data validation failed:', validation.errors);
    }
  }

  handleTryRecovery = () => {
    const success = tryDataRecovery();
    this.setState({ recoveryAttempted: true });
    
    if (success) {
      // Reload the page to reinitialize stores
      window.location.reload();
    } else {
      // Show error message
      alert('Data recovery failed. You may need to reset your data.');
    }
  };

  handleReloadPage = () => {
    window.location.reload();
  };

  handleResetAllData = () => {
    if (confirm('Are you sure you want to reset all data? This will permanently delete all your courses, tasks, and settings. This action cannot be undone.')) {
      clearAllData();
      window.location.reload();
    }
  };

  handleDownloadBackup = () => {
    const backup = createDataBackup();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academicquest-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  handleCloseDialog = () => {
    this.setState({ showRecoveryDialog: false });
  };

  render() {
    if (this.state.hasError && !this.state.showRecoveryDialog) {
      // Generic error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <Button onClick={this.handleReloadPage}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    if (this.state.showRecoveryDialog) {
      return (
        <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <DialogTitle className="text-xl font-bold">Application Error</DialogTitle>
                </div>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  The application encountered an error. This might be due to corrupted data or a temporary issue.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                <Button
                  onClick={this.handleTryRecovery}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={this.state.recoveryAttempted}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Data Recovery
                </Button>
                
                <Button
                  onClick={this.handleReloadPage}
                  variant="outline"
                  className="w-full justify-start"
                >
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleDownloadBackup}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Backup
                </Button>
                
                <Button
                  onClick={this.handleResetAllData}
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset All Data (Last Resort)
                </Button>
              </div>
              
              <DialogFooter>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resetting will clear all stored data and preferences.
                </p>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return this.props.children;
  }
}
