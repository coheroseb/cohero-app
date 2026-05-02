const lucide = require('lucide-react');
const icons = ['Scale', 'BrainCircuit', 'Shield', 'UserCheck', 'CheckSquare', 'AlertCircle', 'ArrowLeft', 'Zap', 'Quote', 'CheckCircle2', 'Lock', 'Sparkles', 'Eye', 'Balance', 'HandMetal'];
icons.forEach(name => {
    if (!lucide[name]) console.log(`Icon missing: ${name}`);
});
