export function isIllustrativeSource(source = {}) {
  const values = [source.id, source.sourceId, source.name, source.coverage, source.sourceClass, source.status, source.health]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toLowerCase());
  return values.some((value) => value === 'demo' || value.includes('illustrative') || value.includes('illustrative_only') || value.includes('demo'));
}

export function isProductiveConnectedSource(source = {}) {
  return source.status === 'connected' && !isIllustrativeSource(source);
}
