import { NextRequest, NextResponse } from "next/server";

const MARKETING_HOST = "zapbroker.dev";
const APP_HOST = "app.zapbroker.dev";

// Rotas que pertencem ao produto (app.zapbroker.dev) — tudo que exige login
// ou faz parte do fluxo de autenticação/pagamento. O resto é marketing.
const APP_PATH_PREFIXES = [
    "/login",
    "/signup",
    "/dashboard",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/auth",
    "/checkout",
    "/assinar",
    "/admin",
];

function isAppPath(pathname: string) {
    return APP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || "";
    const { pathname, search } = request.nextUrl;

    // Local dev / preview deploys: não reescreve nada.
    if (!host.endsWith(MARKETING_HOST)) {
        return NextResponse.next();
    }

    const isAppHost = host === APP_HOST;

    if (isAppHost && !isAppPath(pathname)) {
        // Alguém acessou uma rota de marketing no domínio do app — manda pro domínio certo.
        const url = `https://${MARKETING_HOST}${pathname}${search}`;
        return NextResponse.redirect(url, 308);
    }

    if (!isAppHost && isAppPath(pathname)) {
        // Alguém acessou login/dashboard/etc no domínio de marketing — manda pro app.
        const url = `https://${APP_HOST}${pathname}${search}`;
        return NextResponse.redirect(url, 308);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.*|manifest.json|robots.txt|sitemap.xml).*)"],
};
