import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./lib/supabaseClient";

// URL da API de Geolocalização
const IPINFO_API_URL = "https://ipinfo.io";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Permite somente as rotas "/" e "/poem" e "/monitoring"
  if (
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/poem" &&
    request.nextUrl.pathname !== "/monitoring"
  ) {
    return NextResponse.json(
      { error: "Access to this endpoint is not allowed" },
      { status: 403 } // 403 Forbidden
    );
  }

  // Captura o IP do usuário a partir do cabeçalho x-forwarded-for
  const ip = request.headers.get("x-forwarded-for");

  if (!ip) {
    return NextResponse.json(
      { error: "IP não encontrado" },
      { status: 400 } // 400 Bad Request
    );
  }

  // Realiza a consulta à API externa de geolocalização
  const ipInfo = await getIpInfoFromIp(ip);

  // Obtém o user_id de uma maneira apropriada (substitua por seu método de autenticação)
  const user_id = await getUserIdFromRequest(request); // Função fictícia que retorna o user_id

  // Salva as informações detalhadas do IP no Supabase
  await saveIpInfoToDatabase(ipInfo);

  return response;
}

// Função para consultar informações detalhadas sobre o IP usando a API externa
const getIpInfoFromIp = async (ip: string) => {
  try {
    const res = await fetch(
      `${IPINFO_API_URL}/${ip}/json?token=${process.env.IP_KEY}`
    );
    const data = await res.json();

    // Retorna todos os dados que foram recebidos
    return {
      ip: data.ip,
      hostname: data.hostname,
      city: data.city,
      region: data.region,
      country: data.country,
      loc: data.loc,
      org: data.org,
      postal: data.postal,
      timezone: data.timezone,
    };
  } catch (error) {
    console.error("Erro ao buscar informações do IP:", error);
    return null; // Retorna null em caso de erro
  }
};

// Função para salvar as informações detalhadas do IP no Supabase
const saveIpInfoToDatabase = async (ipInfo: any) => {
  if (!ipInfo) return;

  const supabase = createClient();

  // Insere as informações do IP na tabela ip_info
  const { data, error } = await supabase.from("ip_info").upsert([
    {
      id: crypto.randomUUID(), // Gera um UUID para cada registro
      ip: ipInfo.ip,
      hostname: ipInfo.hostname,
      city: ipInfo.city,
      region: ipInfo.region,
      country: ipInfo.country,
      loc: ipInfo.loc,
      org: ipInfo.org,
      postal: ipInfo.postal,
      timezone: ipInfo.timezone,
    },
  ]);

  if (error) {
    console.error("Erro ao salvar informações do IP no Supabase:", error);
  } else {
    console.log("Informações do IP salvas com sucesso no Supabase:", data);
  }
};

// Função fictícia para obter o user_id, que depende da implementação do seu sistema de autenticação
const getUserIdFromRequest = async (request: NextRequest): Promise<string> => {
  const user_id = request.headers.get("user_id"); // Substitua com a forma correta de identificar o usuário
  return user_id || "anonimo"; // Se não encontrar o user_id, retorna um valor default
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
