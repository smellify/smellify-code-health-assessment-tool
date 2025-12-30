function buildComponentMap(parsedFiles) {
  const componentMap = {};
  const stats = { totalFiles: parsedFiles.length, totalComponents: 0, filesWithErrors: 0 };

  parsedFiles.forEach(fileData => {
    if (fileData.error) { stats.filesWithErrors++; return; }

    fileData.components.forEach(component => {
      stats.totalComponents++;
      let key = component.name;
      if (componentMap[key]) {
        key = `${component.name}_${fileData.file}`;
        console.warn(`Duplicate component: ${component.name}. Key: ${key}`);
      }

      componentMap[key] = {
        name: component.name,
        file: fileData.file,
        line: component.line,
        receivedProps: component.receivedProps,
        defs: component.defs,              // NEW: formal DEF points
        uses: component.uses,              // NEW: formal USE points (C-USE / P-USE)
        forwardedProps: component.forwardedProps, // NEW: props with no local use
        childrenRendered: component.childrenRendered
      };
    });
  });

  return { componentMap, stats };
}

function findComponent(componentMap, name) {
  if (componentMap[name]) return componentMap[name];
  return Object.values(componentMap).find(c => c.name === name) || null;
}

module.exports = { buildComponentMap, findComponent };