function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const original = j(fileInfo.source);

  const found = original.find(j.Identifier);

  const updater = p => j.identifier(p.node.name.toUpperCase());
  const updated = found.replaceWith(updater);

  const transformed = updated.toSource();

  return transformed;
}

module.exports = transformer;
