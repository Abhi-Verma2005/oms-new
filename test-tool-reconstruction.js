// Test tool call reconstruction logic
const collectedToolCalls = [
  {
    "index": 0,
    "id": "call_DyYZSbNxHqiIZE6lumto7qtd",
    "type": "function",
    "function": {
      "name": "applyFilters",
      "arguments": ""
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "{\""
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "da"
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "Min"
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "\":"
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "50"
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": ",\""
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "country"
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "\":\""
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "us"
    }
  },
  {
    "index": 0,
    "function": {
      "arguments": "\"}"
    }
  }
];

console.log('🔍 Testing Tool Call Reconstruction...');
console.log('📥 Input chunks:', collectedToolCalls.length);

// Reconstruct complete tool calls from chunks
const toolCallMap = new Map();

for (const toolCall of collectedToolCalls) {
  // Use index as primary key, fallback to id
  const key = toolCall.index !== undefined ? toolCall.index : toolCall.id;
  
  if (!toolCallMap.has(key)) {
    toolCallMap.set(key, {
      id: toolCall.id,
      index: toolCall.index,
      type: toolCall.type,
      function: {
        name: toolCall.function?.name || '',
        arguments: ''
      }
    });
  }
  
  const existing = toolCallMap.get(key);
  if (toolCall.function?.arguments) {
    existing.function.arguments += toolCall.function.arguments;
  }
}

console.log('🔧 Reconstructed Tool Calls:');
for (const [key, toolCall] of toolCallMap) {
  console.log(`Key ${key}:`, JSON.stringify(toolCall, null, 2));
  
  if (toolCall.function && toolCall.function.name === 'applyFilters') {
    try {
      console.log(`🔧 Processing reconstructed tool call with arguments: ${toolCall.function.arguments}`);
      
      // Extract parameters from complete tool call
      let filters = {};
      if (toolCall.function.arguments && toolCall.function.arguments.trim()) {
        const parsedArgs = JSON.parse(toolCall.function.arguments);
        filters = parsedArgs || {};
      }
      
      console.log(`🧠 Smart AI selected applyFilters with:`, filters);
      console.log('✅ SUCCESS: Filters extracted correctly!');
    } catch (error) {
      console.error('❌ FAILED: JSON parsing error:', error.message);
    }
  }
}


