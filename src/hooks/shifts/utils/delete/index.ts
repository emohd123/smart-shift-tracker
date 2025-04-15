
export { deleteShiftDataFromDatabase } from './singleDeleteUtils';
export { deleteAllShiftsFromDatabase } from './bulkDeleteUtils';
export { validateDeletePermission } from './deletePermissionUtils';

// Re-export all utility functions for easier access
import * as SingleDeleteUtils from './singleDeleteUtils';
import * as BulkDeleteUtils from './bulkDeleteUtils';
import * as DeletePermissionUtils from './deletePermissionUtils';
import * as DeleteRelatedDataUtils from './deleteRelatedDataUtils';

export {
  SingleDeleteUtils,
  BulkDeleteUtils,
  DeletePermissionUtils,
  DeleteRelatedDataUtils
};
