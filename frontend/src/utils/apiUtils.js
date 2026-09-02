/**
 * Simulates an API call to export data and triggers a file download in the browser.
 * 
 * @param {string} format - The format to export (e.g., 'pdf', 'xlsx', 'csv').
 * @param {object} filters - Any filters to apply to the export.
 * @param {string} reportName - The base name of the report.
 * @returns {Promise<void>}
 */
export const exportData = async (format, filters = {}, reportName = 'export') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate creating a Blob from a backend response
      const fileContent = `Mock ${format.toUpperCase()} data for ${reportName}\nFilters: ${JSON.stringify(filters)}`;
      const blob = new Blob([fileContent], { type: 'text/plain' });
      
      // Create a temporary URL for the Blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a hidden anchor tag to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}_${new Date().getTime()}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      resolve();
    }, 1500); // Simulate network delay
  });
};
