import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

import CatsIndex from "@/pages/cats/index";
import CatProfile from "@/pages/cats/[id]";
import CatFeedings from "@/pages/cats/feedings";
import CatAppointments from "@/pages/cats/appointments";
import CatWeight from "@/pages/cats/weight";
import CatBabyBook from "@/pages/cats/baby-book";
import CatMedications from "@/pages/cats/medications";
import CatHealthRecords from "@/pages/cats/health-records";
import CatVetSummary from "@/pages/cats/vet-summary";
import BabyBooks from "@/pages/baby-books";
import MedicationsOverview from "@/pages/medications";
import FeedingsOverview from "@/pages/feedings";
import Guides from "@/pages/guides";
import VetContacts from "@/pages/vet-contacts";
import Vets from "@/pages/vets";
import Pricing from "@/pages/pricing";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(35, 85%, 55%)",
    colorForeground: "hsl(30, 20%, 20%)",
    colorMutedForeground: "hsl(30, 20%, 50%)",
    colorDanger: "hsl(0, 70%, 60%)",
    colorBackground: "hsl(40, 33%, 96%)",
    colorInput: "hsl(30, 20%, 88%)",
    colorInputForeground: "hsl(30, 20%, 20%)",
    colorNeutral: "hsl(30, 20%, 70%)",
    fontFamily: "Nunito, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(40,33%,96%)] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-md border border-[hsl(30,20%,85%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-[hsl(30,20%,20%)]",
    headerSubtitle: "text-[hsl(30,20%,50%)]",
    socialButtonsBlockButtonText: "text-[hsl(30,20%,20%)] font-medium",
    formFieldLabel: "text-[hsl(30,20%,30%)] font-medium text-sm",
    footerActionLink: "text-[hsl(35,85%,45%)] font-semibold",
    footerActionText: "text-[hsl(30,20%,50%)]",
    dividerText: "text-[hsl(30,20%,50%)]",
    identityPreviewEditButton: "text-[hsl(35,85%,45%)]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-[hsl(30,20%,30%)]",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-[hsl(30,20%,80%)] bg-white hover:bg-[hsl(40,33%,96%)]",
    formButtonPrimary: "bg-[hsl(35,85%,55%)] hover:bg-[hsl(35,85%,48%)] text-white",
    formFieldInput: "bg-white border-[hsl(30,20%,80%)] text-[hsl(30,20%,20%)]",
    footerAction: "bg-[hsl(40,33%,93%)]",
    dividerLine: "bg-[hsl(30,20%,80%)]",
    alert: "bg-[hsl(40,33%,92%)] border-[hsl(30,20%,80%)]",
    otpCodeFieldInput: "border-[hsl(30,20%,80%)] bg-white",
    formFieldRow: "",
    main: "",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={CatsIndex} />
        <Route path="/baby-books" component={BabyBooks} />
        <Route path="/cats" component={CatsIndex} />
        <Route path="/medications" component={MedicationsOverview} />
        <Route path="/feedings" component={FeedingsOverview} />
        <Route path="/cats/:id" component={CatProfile} />
        <Route path="/cats/:id/feedings" component={CatFeedings} />
        <Route path="/cats/:id/appointments" component={CatAppointments} />
        <Route path="/cats/:id/weight" component={CatWeight} />
        <Route path="/cats/:id/baby-book" component={CatBabyBook} />
        <Route path="/cats/:id/medications" component={CatMedications} />
        <Route path="/cats/:id/health-records" component={CatHealthRecords} />
        <Route path="/cats/:id/vet-summary" component={CatVetSummary} />
        <Route path="/guides" component={Guides} />
        <Route path="/vets" component={Vets} />
        <Route path="/vet-contacts" component={VetContacts} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? ""}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to Loafing",
            subtitle: "Sign in to see your cats",
          },
        },
        signUp: {
          start: {
            title: "Create your Loafing account",
            subtitle: "Keep track of every loaf in your life",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={AppRoutes} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
