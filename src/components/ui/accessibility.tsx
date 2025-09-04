import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Volume2, VolumeX, Sun, Moon, Type, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Skip Link Component
export const SkipLink: React.FC<{ targetId: string }> = ({ targetId }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium"
  >
    Skip to main content
  </a>
);

// Focus Trap Component
export const FocusTrap: React.FC<{ children: React.ReactNode; enabled?: boolean }> = ({ 
  children, 
  enabled = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return <div ref={containerRef}>{children}</div>;
};

// Screen Reader Text Component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Accessible Button with proper ARIA
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  isPressed?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  isPressed, 
  ariaLabel, 
  ariaDescribedBy, 
  disabled = false,
  className = ""
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    aria-pressed={isPressed}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    className={className}
  >
    {children}
  </Button>
);

// Live Region for Announcements
export const LiveRegion: React.FC<{ 
  message: string; 
  priority?: 'polite' | 'assertive' 
}> = ({ message, priority = 'polite' }) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
  >
    {message}
  </div>
);

// Accessibility Settings Panel
export const AccessibilitySettings: React.FC = () => {
  const [settings, setSettings] = useState({
    highContrast: false,
    reducedMotion: false,
    fontSize: 16,
    screenReader: false,
    darkMode: false
  });

  const [announcements, setAnnouncements] = useState('');

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setAnnouncements(`${key} ${value ? 'enabled' : 'disabled'}`);
    
    // Apply settings to document
    if (key === 'highContrast') {
      document.documentElement.classList.toggle('high-contrast', value);
    }
    if (key === 'reducedMotion') {
      document.documentElement.classList.toggle('reduced-motion', value);
    }
    if (key === 'fontSize') {
      document.documentElement.style.fontSize = `${value}px`;
    }
  };

  const resetSettings = () => {
    setSettings({
      highContrast: false,
      reducedMotion: false,
      fontSize: 16,
      screenReader: false,
      darkMode: false
    });
    setAnnouncements('Settings reset to defaults');
    
    // Reset document classes
    document.documentElement.classList.remove('high-contrast', 'reduced-motion');
    document.documentElement.style.fontSize = '';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Accessibility Settings
        </CardTitle>
        <CardDescription>
          Customize the interface to meet your accessibility needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LiveRegion message={announcements} />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="high-contrast" className="text-sm font-medium">
                High Contrast
              </label>
              <p className="text-xs text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              aria-describedby="high-contrast-description"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="reduced-motion" className="text-sm font-medium">
                Reduce Motion
              </label>
              <p className="text-xs text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <label htmlFor="font-size" className="text-sm font-medium">
              Font Size: {settings.fontSize}px
            </label>
            <Slider
              id="font-size"
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting('fontSize', value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
              aria-describedby="font-size-description"
            />
            <p id="font-size-description" className="text-xs text-muted-foreground">
              Adjust text size from 12px to 24px
            </p>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="screen-reader" className="text-sm font-medium">
                Screen Reader Mode
              </label>
              <p className="text-xs text-muted-foreground">
                Optimize for screen reader users
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={settings.screenReader}
              onCheckedChange={(checked) => updateSetting('screenReader', checked)}
            />
          </div>
        </div>
        
        <Button 
          onClick={resetSettings} 
          variant="outline" 
          className="w-full"
          aria-describedby="reset-description"
        >
          Reset to Defaults
        </Button>
        <p id="reset-description" className="text-xs text-muted-foreground text-center">
          This will restore all accessibility settings to their default values
        </p>
      </CardContent>
    </Card>
  );
};

// Keyboard Navigation Helper
export const useKeyboardNavigation = (items: HTMLElement[], loop = true) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev + 1;
          return next >= items.length ? (loop ? 0 : prev) : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev - 1;
          return next < 0 ? (loop ? items.length - 1 : 0) : next;
        });
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  };

  useEffect(() => {
    if (items[activeIndex]) {
      items[activeIndex].focus();
    }
  }, [activeIndex, items]);

  return { activeIndex, handleKeyDown };
};

// Color Contrast Checker
export const useColorContrast = () => {
  const checkContrast = (foreground: string, background: string): number => {
    // Simplified contrast calculation
    const getLuminance = (color: string): number => {
      // Convert hex to RGB and calculate luminance
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  const meetsWCAG = (contrast: number, level: 'AA' | 'AAA' = 'AA'): boolean => {
    return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
  };

  return { checkContrast, meetsWCAG };
};