import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Settings from "@/pages/settings";
import CameraPage from "@/pages/camera";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/settings" component={Settings}/>
      <Route path="/camera" component={CameraPage}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Load TensorFlow.js when the app starts
  useEffect(() => {
    // Import dynamically to prevent server-side rendering issues
    import('@tensorflow/tfjs').then(tf => {
      // Initialize TensorFlow.js
      tf.ready().then(() => {
        console.log('TensorFlow.js initialized successfully');
      });
    }).catch(err => {
      console.error('Error loading TensorFlow.js:', err);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col overflow-hidden">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
