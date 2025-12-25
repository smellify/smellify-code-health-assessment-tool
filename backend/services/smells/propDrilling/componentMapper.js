// // services/componentMapper.js

// /**
//  * Build a component map from parsed file data
//  * Creates a lookup structure: componentName -> component data
//  */
// function buildComponentMap(parsedFiles) {
//   const componentMap = {};
//   const stats = {
//     totalFiles: parsedFiles.length,
//     totalComponents: 0,
//     filesWithErrors: 0
//   };

//   parsedFiles.forEach(fileData => {
//     // Track files with parsing errors
//     if (fileData.error) {
//       stats.filesWithErrors++;
//       return;
//     }

//     fileData.components.forEach(component => {
//       stats.totalComponents++;
      
//       // Handle duplicate component names by appending file path
//       let componentKey = component.name;
      
//       if (componentMap[componentKey]) {
//         // Component name already exists, make it unique
//         componentKey = `${component.name}_${fileData.file}`;
//         console.warn(`Duplicate component name: ${component.name}. Using key: ${componentKey}`);
//       }

//       componentMap[componentKey] = {
//         name: component.name,
//         file: fileData.file,
//         line: component.line,
//         propsReceived: component.propsReceived,
//         propsUsedLocally: component.propsUsedLocally,
//         childrenRendered: component.childrenRendered
//       };
//     });
//   });

//   return {
//     componentMap,
//     stats
//   };
// }

// /**
//  * Find a component in the map by name
//  * Handles fuzzy matching if exact match not found
//  */
// function findComponent(componentMap, componentName) {
//   // Try exact match first
//   if (componentMap[componentName]) {
//     return componentMap[componentName];
//   }

//   // Try to find by component name without file path suffix
//   for (const key in componentMap) {
//     if (componentMap[key].name === componentName) {
//       return componentMap[key];
//     }
//   }

//   return null;
// }

// /**
//  * Get all props that are forwarded but not used
//  */
// function getForwardedProps(component) {
//   const forwarded = [];
//   const forwardedSet = new Set();
  
//   component.childrenRendered.forEach(child => {
//     child.propsPassedDown.forEach(prop => {
//       // Check if this prop is received but not used locally
//       if (component.propsReceived.includes(prop) && 
//           !component.propsUsedLocally.includes(prop)) {
//         const key = `${prop}->${child.component}`;
//         if (!forwardedSet.has(key)) {
//           forwarded.push({
//             prop,
//             passedTo: child.component,
//             line: child.line
//           });
//           forwardedSet.add(key);
//         }
//       }
//     });
//   });

//   return forwarded;
// }

// /**
//  * Debug helper to print component map structure
//  */
// function printComponentMapSummary(componentMap) {
//   console.log('\n=== Component Map Summary ===');
//   console.log(`Total components: ${Object.keys(componentMap).length}`);
  
//   Object.entries(componentMap).forEach(([key, component]) => {
//     console.log(`\n${key}:`);
//     console.log(`  File: ${component.file}:${component.line}`);
//     console.log(`  Props received: ${component.propsReceived.join(', ') || 'none'}`);
//     console.log(`  Props used: ${component.propsUsedLocally.join(', ') || 'none'}`);
//     console.log(`  Children: ${component.childrenRendered.length}`);
    
//     if (component.childrenRendered.length > 0) {
//       component.childrenRendered.forEach(child => {
//         console.log(`    -> ${child.component} (props: ${child.propsPassedDown.join(', ')})`);
//       });
//     }
//   });
// }

// module.exports = {
//   buildComponentMap,
//   findComponent,
//   getForwardedProps,
//   printComponentMapSummary
// };


// services/propDrilling/componentMapper.js

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