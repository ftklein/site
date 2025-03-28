
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import OfficePage from "@/pages/OfficePage";
import LawyerPage from "@/pages/LawyerPage";
import PracticeAreasPage from "@/pages/PracticeAreasPage";
import ArticlesPage from "@/pages/ArticlesPage";
import ContactPage from "@/pages/ContactPage";
import DashboardPage from "@/pages/DashboardPage";
import ArticleEditorPage from "@/pages/admin/ArticleEditorPage";
import ArticlesListPage from "@/pages/admin/ArticlesListPage";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/escritorio" component={OfficePage} />
            <Route path="/advogado" component={LawyerPage} />
            <Route path="/areas-atuacao" component={PracticeAreasPage} />
            <Route path="/artigos" component={ArticlesPage} />
            <Route path="/contato" component={ContactPage} />
            <Route path="/dashboard/pages/editor/home" component={PageEditorPage} />
            <Route path="/dashboard/pages/editor/office" component={PageEditorPage} />
            <Route path="/dashboard/pages/editor/lawyer" component={PageEditorPage} />
            <Route path="/dashboard/pages/editor/practice-areas" component={PageEditorPage} />
            <Route path="/dashboard/articles/new" component={ArticleEditorPage} />
            <Route path="/dashboard/articles/:id/edit" component={ArticleEditorPage} />
            <Route path="/dashboard/articles" component={ArticlesListPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
