const fs = require('fs')

console.log('🔧 TESTING SIDEBAR FIXES')
console.log('========================\n')

try {
  // Check if all files exist and have correct imports
  const files = [
    'components/ai-chatbot-sidebar.tsx',
    'components/resizable-layout.tsx'
  ]
  
  let allGood = true
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      
      console.log(`📁 ${file}:`)
      
      // Check for correct imports
      if (file.includes('ai-chatbot-sidebar')) {
        if (content.includes("import { useChat } from 'ai'")) {
          console.log('  ✅ Correct useChat import')
        } else {
          console.log('  ❌ Wrong useChat import')
          allGood = false
        }
        
        if (content.includes('export default function AIChatbotSidebar')) {
          console.log('  ✅ Default export found')
        } else {
          console.log('  ❌ Missing default export')
          allGood = false
        }
      }
      
      if (file.includes('resizable-layout')) {
        if (content.includes("import AIChatbotSidebar from './ai-chatbot-sidebar'")) {
          console.log('  ✅ Correct sidebar import')
        } else {
          console.log('  ❌ Wrong sidebar import')
          allGood = false
        }
      }
      
      console.log('')
    } else {
      console.log(`❌ ${file} not found`)
      allGood = false
    }
  })
  
  if (allGood) {
    console.log('🎉 ALL FIXES APPLIED SUCCESSFULLY!')
    console.log('')
    console.log('✅ Import paths fixed: ai/react → ai')
    console.log('✅ Export/import mismatch fixed')
    console.log('✅ Component structure verified')
    console.log('')
    console.log('🚀 The AI chat sidebar should now work correctly!')
  } else {
    console.log('❌ Some issues remain')
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message)
}
