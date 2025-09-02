interface GrowthTreeProps {
  promisesKept: number;
  totalPromises: number;
  growthLevel: number;
  completedTasks?: number;
  size?: 'small' | 'medium' | 'large';
  monthsActive?: number; // For monthly progression
}

export default function GrowthTree({ 
  promisesKept = 0, 
  totalPromises = 0, 
  growthLevel = 1,
  completedTasks = 0,
  size = 'medium',
  monthsActive = 0
}: GrowthTreeProps) {
  
  const getTreeSize = () => {
    switch (size) {
      case 'small': return { width: 'w-24', height: 'h-32', trunk: 'w-3 h-12' };
      case 'large': return { width: 'w-40', height: 'h-48', trunk: 'w-5 h-20' };
      default: return { width: 'w-32', height: 'h-40', trunk: 'w-4 h-16' };
    }
  };

  const treeSize = getTreeSize();
  
  // Get tree maturity based on months active
  const getTreeMaturity = () => {
    if (monthsActive < 1) return 'seedling';
    if (monthsActive < 3) return 'young';
    if (monthsActive < 6) return 'mature';
    if (monthsActive < 12) return 'flourishing';
    return 'ancient';
  };
  
  const treeMaturity = getTreeMaturity();
  
  
  // Get maturity message based on tree age
  const getMaturityMessage = () => {
    switch (treeMaturity) {
      case 'seedling': return 'Fresh beginnings take root';
      case 'young': return 'Growing stronger each month';
      case 'mature': return 'Rooted in wisdom and growth';
      case 'flourishing': return 'A testament to your consistency';
      case 'ancient': return 'Deep wisdom cultivated over time';
      default: return '';
    }
  };
  
  // Generate flowers based only on promises kept - 1 flower per promise
  const generateFlowers = () => {
    const flowers: JSX.Element[] = [];
    // Show exactly 1 flower per promise kept
    const flowerCount = promisesKept;
    
    if (flowerCount === 0) return flowers;
    
    for (let i = 0; i < flowerCount; i++) {
      // Constrain flower positions to actual foliage area (tree circles)
      // Foliage spans: bottom-12 to bottom-24, width spans -ml-12 to ml-12
      const positions = [
        { left: '-ml-6', bottom: 'bottom-18', color: 'text-pink-400' },   // Main foliage
        { left: 'ml-6', bottom: 'bottom-19', color: 'text-rose-300' },    // Main foliage
        { left: '-ml-4', bottom: 'bottom-20', color: 'text-purple-300' }, // Main foliage
        { left: 'ml-4', bottom: 'bottom-21', color: 'text-pink-300' },    // Main foliage
        { left: '-ml-8', bottom: 'bottom-17', color: 'text-violet-300' }, // Left foliage
        { left: 'ml-8', bottom: 'bottom-18', color: 'text-rose-400' },    // Right foliage
        { left: '-ml-2', bottom: 'bottom-22', color: 'text-pink-200' },   // Center foliage
        { left: 'ml-2', bottom: 'bottom-16', color: 'text-purple-200' },  // Center foliage
        { left: '-ml-5', bottom: 'bottom-19', color: 'text-rose-200' },   // Left-center
        { left: 'ml-5', bottom: 'bottom-20', color: 'text-pink-500' },    // Right-center
        { left: '-ml-7', bottom: 'bottom-21', color: 'text-violet-400' }, // Left foliage
        { left: 'ml-7', bottom: 'bottom-17', color: 'text-purple-400' }   // Right foliage
      ];
      
      const position = positions[i % positions.length];
      
      flowers.push(
        <div 
          key={`flower-${i}`}
          className={`absolute ${position.bottom} left-1/2 transform -translate-x-1/2 ${position.left} animate-pulse z-10`}
          style={{ 
            animationDelay: `${i * 0.3}s`,
            animationDuration: '2s'
          }}
        >
          <div className={`w-2 h-2 ${position.color} relative`}>
            {/* Flower petals using CSS */}
            <div className="absolute inset-0 rounded-full bg-current opacity-80"></div>
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 rounded-full bg-current opacity-60"></div>
            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-current opacity-60"></div>
            <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 rounded-full bg-current opacity-60"></div>
            <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 rounded-full bg-current opacity-60"></div>
          </div>
        </div>
      );
    }
    
    return flowers;
  };

  // Generate basic leaves for the tree - positioned within foliage boundaries
  const generateLeaves = () => {
    const leaves = [];
    // Simple leaf count - just a few leaves on the tree naturally
    const leafCount = Math.min(4 + Math.floor(promisesKept / 3), 8);
    
    for (let i = 0; i < leafCount; i++) {
      // Keep leaves within the tree foliage area (bottom-12 to bottom-16)
      const leafPositions = [
        { left: '-ml-3', bottom: 'bottom-14', rotate: 'rotate-12' },
        { left: 'ml-3', bottom: 'bottom-15', rotate: '-rotate-12' },
        { left: '-ml-2', bottom: 'bottom-13', rotate: 'rotate-45' },
        { left: 'ml-2', bottom: 'bottom-16', rotate: '-rotate-45' },
        { left: '-ml-4', bottom: 'bottom-14', rotate: 'rotate-6' },
        { left: 'ml-4', bottom: 'bottom-15', rotate: '-rotate-6' },
        { left: '-ml-1', bottom: 'bottom-13', rotate: 'rotate-24' },
        { left: 'ml-1', bottom: 'bottom-16', rotate: '-rotate-24' }
      ];
      
      const position = leafPositions[i % leafPositions.length];
      
      leaves.push(
        <div 
          key={`leaf-${i}`}
          className={`absolute ${position.bottom} left-1/2 transform -translate-x-1/2 ${position.left} ${position.rotate}`}
        >
          <div className="w-1.5 h-3 bg-sage rounded-full opacity-70 transform skew-y-12"></div>
        </div>
      );
    }
    
    return leaves;
  };

  // Calculate tree health/fullness based on growth level
  const getTreeOpacity = () => {
    return Math.min(1, 0.4 + (growthLevel * 0.12));
  };

  return (
    <div className="relative mx-auto flex flex-col items-center" data-testid="growth-tree">
      <div className={`${treeSize.width} ${treeSize.height} relative flex justify-center`}>
        {/* Tree trunk - simple and clean */}
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${treeSize.trunk} bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-t-lg shadow-sm`}>
          {/* Simple tree texture */}
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-amber-600 opacity-50"></div>
          <div className="absolute right-1/4 top-0 bottom-0 w-px bg-amber-900 opacity-30"></div>
        </div>
        
        {/* Tree foliage - simple and natural */}
        <div 
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-forest rounded-full transition-all duration-1000"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #22c55e, #16a34a, #15803d)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
        ></div>
        <div 
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 -ml-3 w-20 h-20 bg-emerald rounded-full transition-all duration-1000"
          style={{ opacity: 0.8 }}
        ></div>
        <div 
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 ml-3 w-20 h-20 bg-sage rounded-full transition-all duration-1000"
          style={{ opacity: 0.7 }}
        ></div>
        
        
        
        
        {/* Flowers - bloom with each promise kept */}
        {generateFlowers()}
        
      </div>
      
      {/* Tree wisdom - green text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-forest font-elegant italic">
          Each promise kept blooms a flower in your growth garden
        </p>
        {monthsActive > 0 && (
          <p className="text-xs text-forest font-elegant mt-1 italic">
            {getMaturityMessage()}
          </p>
        )}
      </div>
      
    </div>
  );
}