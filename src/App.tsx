import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // NUCLEAR OPTION: Force complete app refresh every render
  const refreshTimestamp = Date.now();
  
  // Apply styles directly to DOM on every render
  React.useEffect(() => {
    document.body.style.backgroundColor = 'hsl(150, 8%, 97%)';
    document.documentElement.style.backgroundColor = 'hsl(150, 8%, 97%)';
    
    // Force all page indicators to be circles
    const indicators = document.querySelectorAll('[data-testid*="indicator"]');
    indicators.forEach(el => {
      (el as HTMLElement).style.cssText = 'width: 12px !important; height: 12px !important; border-radius: 50% !important; border: 2px solid hsl(149, 38%, 20%) !important; background-color: hsl(149, 38%, 20%) !important; transition: all 0.5s ease !important;';
    });
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div 
          key={refreshTimestamp}
          data-app-version={refreshTimestamp}
          style={{ 
            backgroundColor: 'hsl(150, 8%, 97%) !important',
            minHeight: '100vh !important',
            fontFamily: '"Libre Baskerville", serif !important'
          }}
        >
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
