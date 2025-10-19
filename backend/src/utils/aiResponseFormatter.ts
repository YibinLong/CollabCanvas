/**
 * AI Response Formatter Utility
 * 
 * WHY: Converts technical AI commands into natural, user-friendly messages
 * that explain what the AI actually did. Makes the chat experience more conversational.
 * 
 * WHAT: Takes an array of executed AI commands and generates a human-readable 
 * description like "Created 2 blue rectangles and moved them to the center"
 * instead of "Executed 3 command(s), affected 2 shape(s)"
 */

import { AICommand } from '../services/aiCanvasOperations';

/**
 * Generates a user-friendly description of what the AI did
 * 
 * @param commands - Array of AI commands that were executed
 * @param shapeIds - Array of shape IDs that were affected
 * @returns A natural language description
 */
export function formatAIResponse(commands: AICommand[], shapeIds: string[]): string {
  if (commands.length === 0) {
    return "I couldn't understand that command. Could you try rephrasing?";
  }

  // Group commands by type for more natural descriptions
  const commandGroups = groupCommandsByType(commands);
  const descriptions: string[] = [];

  // Process each command type and create descriptions
  for (const [type, cmds] of Object.entries(commandGroups)) {
    const description = describeCommandGroup(type, cmds);
    if (description) {
      descriptions.push(description);
    }
  }

  // Combine all descriptions into a natural sentence
  if (descriptions.length === 0) {
    return 'Done! Your canvas has been updated.';
  } else if (descriptions.length === 1) {
    return descriptions[0] + '.';
  } else if (descriptions.length === 2) {
    return descriptions[0] + ' and ' + descriptions[1] + '.';
  } else {
    const last = descriptions.pop();
    return descriptions.join(', ') + ', and ' + last + '.';
  }
}

/**
 * Groups commands by their type for easier processing
 * 
 * WHY: If the AI created 5 rectangles, we want to say "Created 5 rectangles" 
 * not list each rectangle separately
 */
function groupCommandsByType(commands: AICommand[]): Record<string, AICommand[]> {
  const groups: Record<string, AICommand[]> = {};
  
  for (const cmd of commands) {
    if (!groups[cmd.type]) {
      groups[cmd.type] = [];
    }
    groups[cmd.type].push(cmd);
  }
  
  return groups;
}

/**
 * Creates a natural language description for a group of similar commands
 * 
 * WHY: Each command type needs different wording. "Created" for shapes,
 * "Moved" for positions, "Changed" for colors, etc.
 */
function describeCommandGroup(type: string, commands: AICommand[]): string {
  const count = commands.length;
  
  switch (type) {
    case 'createShape':
      return describeCreateShape(commands);
    
    case 'createText':
      return describeCreateText(commands);
    
    case 'moveShape':
      return describeMoveShape(commands);
    
    case 'resizeShape':
      return describeResizeShape(commands);
    
    case 'rotateShape':
      return describeRotateShape(commands);
    
    case 'changeColor':
      return describeChangeColor(commands);
    
    case 'deleteShape':
      return describeDeleteShape(commands);
    
    case 'arrangeShapes':
      return describeArrangeShapes(commands);
    
    case 'alignShapes':
      return describeAlignShapes(commands);
    
    case 'duplicateShape':
      return describeDuplicateShape(commands);
    
    case 'createGroup':
      return describeCreateGroup(commands);
    
    default:
      return `Executed ${count} ${type} command${count > 1 ? 's' : ''}`;
  }
}

// ==================== Description Functions for Each Command Type ====================

function describeCreateShape(commands: AICommand[]): string {
  // Group by shape type and color
  const shapeGroups: Record<string, { color?: string; count: number }> = {};
  
  for (const cmd of commands) {
    const key = `${cmd.shapeType}-${cmd.color || 'default'}`;
    if (!shapeGroups[key]) {
      shapeGroups[key] = { color: cmd.color, count: 0 };
    }
    shapeGroups[key].count++;
  }
  
  const descriptions: string[] = [];
  for (const [key, info] of Object.entries(shapeGroups)) {
    const shapeType = key.split('-')[0];
    const shapeName = getShapeName(shapeType, info.count);
    const colorDesc = info.color ? `${info.color} ` : '';
    const countDesc = info.count > 1 ? `${info.count} ` : 'a ';
    
    descriptions.push(`${countDesc}${colorDesc}${shapeName}`);
  }
  
  if (descriptions.length === 1) {
    return `Created ${descriptions[0]}`;
  } else if (descriptions.length === 2) {
    return `Created ${descriptions[0]} and ${descriptions[1]}`;
  } else {
    const last = descriptions.pop();
    return `Created ${descriptions.join(', ')}, and ${last}`;
  }
}

function describeCreateText(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    const text = commands[0].text || 'text';
    const truncated = text.length > 30 ? text.substring(0, 30) + '...' : text;
    return `Added text "${truncated}"`;
  } else {
    return `Added ${count} text elements`;
  }
}

function describeMoveShape(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    return `Moved shape to (${commands[0].x}, ${commands[0].y})`;
  } else {
    return `Moved ${count} shapes`;
  }
}

function describeResizeShape(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    return `Resized shape to ${commands[0].width} × ${commands[0].height}`;
  } else {
    return `Resized ${count} shapes`;
  }
}

function describeRotateShape(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    return `Rotated shape ${commands[0].degrees}°`;
  } else {
    return `Rotated ${count} shapes`;
  }
}

function describeChangeColor(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1 && commands[0].shapeIds) {
    const shapeCount = commands[0].shapeIds.length;
    const color = commands[0].color || 'new color';
    return `Changed ${shapeCount} shape${shapeCount > 1 ? 's' : ''} to ${color}`;
  } else {
    return `Changed colors`;
  }
}

function describeDeleteShape(commands: AICommand[]): string {
  // Count total shapes deleted across all commands
  let totalDeleted = 0;
  for (const cmd of commands) {
    if (Array.isArray(cmd.shapeIds)) {
      totalDeleted += cmd.shapeIds.length;
    } else {
      totalDeleted++;
    }
  }
  
  if (totalDeleted === 0) {
    return 'Cleared the canvas';
  } else if (totalDeleted === 1) {
    return 'Deleted 1 shape';
  } else {
    return `Deleted ${totalDeleted} shapes`;
  }
}

function describeArrangeShapes(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    const cmd = commands[0];
    const shapeCount = cmd.shapeIds?.length || 0;
    
    if (cmd.mode === 'grid' && cmd.cols) {
      return `Arranged ${shapeCount} shapes in a grid (${cmd.cols} columns)`;
    } else if (cmd.mode === 'horizontal') {
      return `Arranged ${shapeCount} shapes horizontally`;
    } else if (cmd.mode === 'vertical') {
      return `Arranged ${shapeCount} shapes vertically`;
    } else {
      return `Arranged ${shapeCount} shapes`;
    }
  } else {
    return `Arranged shapes in ${count} layouts`;
  }
}

function describeAlignShapes(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    const cmd = commands[0];
    const shapeCount = cmd.shapeIds?.length || 0;
    const alignment = cmd.alignment || 'center';
    
    // Convert alignment enum to readable text
    const alignmentText = formatAlignmentDirection(alignment);
    
    return `Aligned ${shapeCount} shapes to the ${alignmentText}`;
  } else {
    return `Aligned shapes in ${count} different ways`;
  }
}

/**
 * Converts alignment enum values to readable text
 * 
 * WHY: The alignment values are 'left', 'right', 'center-horizontal', etc.
 * We need to make them sound natural in sentences.
 */
function formatAlignmentDirection(alignment: string): string {
  const alignmentMap: Record<string, string> = {
    'left': 'left',
    'right': 'right',
    'top': 'top',
    'bottom': 'bottom',
    'center-horizontal': 'center horizontally',
    'center-vertical': 'center vertically',
  };
  
  return alignmentMap[alignment] || alignment;
}

function describeDuplicateShape(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    const shapeCount = commands[0].shapeIds?.length || 1;
    return `Duplicated ${shapeCount} shape${shapeCount > 1 ? 's' : ''}`;
  } else {
    return `Duplicated ${count} selections`;
  }
}

function describeCreateGroup(commands: AICommand[]): string {
  const count = commands.length;
  if (count === 1) {
    const cmd = commands[0];
    const description = getGroupDescription(cmd);
    return `Created ${description}`;
  } else {
    return `Created ${count} component groups`;
  }
}

/**
 * Returns a human-readable description of a component group
 * 
 * WHY: Professional UI components (buttons, cards, navbars) should be 
 * described by what they are, not technical details
 */
function getGroupDescription(cmd: AICommand): string {
  const groupType = cmd.groupType || 'component';
  
  switch (groupType) {
    case 'button':
      const buttonText = cmd.metadata?.text || 'button';
      return `a ${buttonText} button`;
    
    case 'card':
      return 'a professional card component';
    
    case 'login-form':
      return 'a login form with email and password fields';
    
    case 'navbar':
      return 'a navigation bar';
    
    default:
      return `a ${groupType} component`;
  }
}

/**
 * Returns the proper singular/plural name for a shape type
 */
function getShapeName(shapeType: string, count: number): string {
  const names: Record<string, { singular: string; plural: string }> = {
    'rect': { singular: 'rectangle', plural: 'rectangles' },
    'circle': { singular: 'circle', plural: 'circles' },
    'line': { singular: 'line', plural: 'lines' },
    'ellipse': { singular: 'ellipse', plural: 'ellipses' },
  };
  
  const name = names[shapeType] || { singular: shapeType, plural: shapeType + 's' };
  return count > 1 ? name.plural : name.singular;
}

