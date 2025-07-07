// Components
export { Badge } from "./components/badge";

export { Button, buttonVariants } from "./components/button";

export { Calendar } from "./components/calendar";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./components/card";

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./components/dialog";

// Form components temporarily excluded to resolve build issues
// Use local copies in components that need forms
// export { 
//   Form, 
//   FormItem, 
//   FormLabel, 
//   FormControl, 
//   FormDescription, 
//   FormMessage, 
//   FormField,
//   useFormField 
// } from "./components/form";

export { Input } from "./components/input";
export type { InputProps } from "./components/input";

export { Label } from "./components/label";

export { 
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport
} from "./components/navigation-menu";

export { 
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem
} from "./components/select";

export { Switch } from "./components/switch";

export { Textarea } from "./components/textarea";
export type { TextareaProps } from "./components/textarea";

// Lib utilities
export { cn } from "./lib/utils";

// Styles (import in your app)
// import "@calendar-todo/ui/styles/globals.css";