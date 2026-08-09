function clone(value) { return structuredClone(value); }
function pick(object, fields) { return Object.fromEntries(fields.filter((field) => object?.[field] !== undefined).map((field) => [field, object[field]])); }

export function redactSharedDecisionPackage(input = {}) {
  const result = clone(input);
  result.case = pick(result.case, ['id', 'alertId', 'title', 'owner', 'priority', 'status', 'slaMinutes', 'impactUsd', 'humanValidation', 'createdAt', 'updatedAt']);
  result.alert = pick(result.alert, ['id', 'severity', 'title', 'location', 'impactUsd', 'status', 'createdAt', 'sourceIds', 'evidenceClass', 'vertical']);
  result.sources = (Array.isArray(result.sources) ? result.sources : []).map((source) => pick(source, ['id', 'name', 'kind', 'status', 'coverage', 'licenseStatus', 'sourceClass']));
  result.scenarios = (Array.isArray(result.scenarios) ? result.scenarios : []).map((scenario) => pick(scenario, ['id', 'name', 'status', 'lossIfWaitUsd', 'mitigationCostUsd', 'protectedValueUsd', 'confidence', 'horizonHours', 'assumptions', 'evidenceClass', 'evidence']));
  result.audit = (Array.isArray(result.audit) ? result.audit : []).map((entry) => pick(entry, ['id', 'entityType', 'entityId', 'action', 'message', 'createdAt']));
  result.comments = (Array.isArray(result.comments) ? result.comments : []).map((comment) => pick(comment, ['id', 'caseId', 'body', 'createdAt']));
  result.capacityInquiries = (Array.isArray(result.capacityInquiries) ? result.capacityInquiries : []).map((inquiry) => ({ ...pick(inquiry, ['id', 'caseId', 'offerId', 'requestedUnits', 'status', 'externalAction', 'createdAt']), offer: inquiry.offer ? pick(inquiry.offer, ['id', 'name', 'category', 'coverage', 'estimatedCostUsd', 'leadTimeHours']) : null }));
  result.shareExposure = { policyVersion: 'local-share-redaction-v1', redactedFields: ['organizationId', 'payload', 'raw', 'tokenHash', 'secret', 'contractRef', 'createdBy', 'actor', 'author'] };
  return result;
}
