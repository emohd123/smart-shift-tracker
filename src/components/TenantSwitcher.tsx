import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, ChevronDown, Building2 } from 'lucide-react';
import { useContext } from 'react';
import { TenantContext } from '@/hooks/useCurrentTenant';
import { Badge } from '@/components/ui/badge';

export const TenantSwitcher: React.FC = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) return null; // Provider not ready yet
  const { currentTenant, userMemberships, switchTenant, isLoading } = ctx;

  if (isLoading || userMemberships.length <= 1) {
    return null; // Don't show switcher if loading or only one tenant
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'company_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'company_manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'company_admin':
        return 'Admin';
      case 'company_manager':
        return 'Manager';
      default:
        return 'Part-timer';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                {(currentTenant?.name?.charAt(0) || 'T').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-32">
                {currentTenant?.name || 'Select Tenant'}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentTenant?.subscription_tier}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span>Switch Organization</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userMemberships.map((membership) => (
          <DropdownMenuItem
            key={membership.id}
            onClick={() => switchTenant(membership.tenant_id)}
            className="flex items-center justify-between p-3 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {(membership.tenant?.name?.charAt(0) || 'T').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {membership.tenant?.name}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0 ${getRoleBadgeColor(membership.role)}`}
                  >
                    {getRoleLabel(membership.role)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {membership.tenant?.subscription_tier}
                  </span>
                </div>
              </div>
            </div>
            
            {currentTenant?.id === membership.tenant_id && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};