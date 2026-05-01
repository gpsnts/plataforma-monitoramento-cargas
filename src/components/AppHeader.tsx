import { Zap, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-card">
            <Zap className="w-6 h-6 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Sistema Evolog</h1>
            <p className="text-xs text-muted-foreground">Automação de Gerenciamento de Cargas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-soft text-success text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            API Conectada
          </div>
          <span className="hidden md:inline text-xs text-muted-foreground">api.evolog.com.br</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
