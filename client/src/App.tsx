import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from 'next-themes';
import NotFound from "@/pages/not-found";
import DocumentsPage from "@/pages/DocumentsPage";
import EditorPage from "@/pages/Home";
import LoginPage from "@/pages/LoginPage";
import AuthCallback from "@/pages/AuthCallback";
import TexturesPage from "@/pages/TexturesPage";
import AdminPage from "@/pages/AdminPage";
import DebugPage from "@/pages/DebugPage";

function CommunityRedirect() {
  return <Redirect to="/textures" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DocumentsPage} />
      <Route path="/edit/:id" component={EditorPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/textures" component={TexturesPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/community" component={CommunityRedirect} />
      <Route path="/debug" component={DebugPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
