import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Phone, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import ashishiMascot from "@/assets/ashishi-mascot.png";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type Message = {
  role: "user" | "assistant";
  content: string;
  productCards?: ProductCard[];
};

interface ProductCard {
  id: string;
  name: string;
  price: number;
  image: string | null;
  brand: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-chat`;
const COMPANY_PHONE = "+237 673750693";

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

/* Extract bold text mentions from markdown */
const extractBoldMentions = (text: string): string[] => {
  const matches: string[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const mention = m[1].trim();
    // Filter out likely non-product names (too short, or are labels like "NEW", "In Stock")
    if (mention.length > 3 && !["NEW", "In Stock", "Out of Stock", "FCFA"].includes(mention)) {
      matches.push(mention);
    }
  }
  return [...new Set(matches)]; // deduplicate
};

/* Fetch product data for mentioned names */
const fetchMentionedProducts = async (content: string): Promise<ProductCard[]> => {
  const mentions = extractBoldMentions(content);
  if (mentions.length === 0) return [];

  // Build OR filter for first 4 mentions
  const top4 = mentions.slice(0, 4);
  const orFilters = top4.map(m => `name.ilike.%${m.substring(0, 20)}%`).join(",");

  try {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, retail_price, images, brand")
      .eq("is_active", true)
      .or(orFilters)
      .limit(4);

    return (data ?? []).map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.retail_price ?? p.price ?? 0),
      image: p.images?.[0] ?? null,
      brand: p.brand ?? "",
    }));
  } catch {
    return [];
  }
};

/* Product Card component */
const ProductCardItem = ({ card }: { card: ProductCard }) => (
  <Link
    to={`/products/${card.id}`}
    className="flex-shrink-0 w-[140px] bg-background border border-border rounded-xl overflow-hidden hover:border-primary transition-colors cursor-pointer shadow-sm"
  >
    <div className="w-full h-[100px] bg-muted flex items-center justify-center overflow-hidden">
      {card.image ? (
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
      ) : (
        <ShoppingBag className="w-8 h-8 text-muted-foreground" />
      )}
    </div>
    <div className="p-2">
      <p className="text-xs font-semibold truncate leading-tight">{card.name}</p>
      {card.brand && <p className="text-xs text-muted-foreground truncate">{card.brand}</p>}
      <p className="text-xs font-bold text-primary mt-1">{fmtCFA(card.price)}</p>
    </div>
  </Link>
);

const AIChatBot = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Show popup after a delay if not dismissed
  useEffect(() => {
    if (!popupDismissed && !isOpen) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [popupDismissed, isOpen]);

  // Hide popup when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowPopup(false);
      setPopupDismissed(true);
    }
  }, [isOpen]);

  const handleMouseEnterArea = () => {
    if (!isOpen && !popupDismissed) {
      setShowPopup(true);
    }
  };

  /* After streaming is done, enrich last assistant message with product cards */
  const enrichWithProductCards = useCallback(async (content: string) => {
    const cards = await fetchMentionedProducts(content);
    if (cards.length === 0) return;
    setMessages(prev => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (updated[lastIdx]?.role === "assistant") {
        updated[lastIdx] = { ...updated[lastIdx], productCards: cards };
      }
      return updated;
    });
  }, []);

  const streamChat = async (userMessages: Message[]) => {
    const messagesPayload = userMessages.map(({ role, content }) => ({ role, content }));

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: messagesPayload, language }),
    });

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const finalContent = await streamChat(newMessages);
      // After streaming is complete, fetch product cards for the response
      if (finalContent) {
        await enrichWithProductCards(finalContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: language === "fr"
            ? "Désolé, une erreur s'est produite. Veuillez réessayer ou appelez-nous."
            : "Sorry, an error occurred. Please try again or call us.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const welcomeMessage = language === "fr"
    ? "Salut! Je suis Ashishi, votre assistant shopping! 🛋️ Comment puis-je vous aider à trouver le produit parfait?"
    : "Hi there! I'm Ashishi, your shopping assistant! 🛋️ How can I help you find the perfect product?";

  const popupMessage = language === "fr"
    ? "👋 Salut! Je suis Ashishi! Laissez-moi simplifier votre shopping!"
    : "👋 Hi! I'm Ashishi! Let me simplify your shopping!";

  return (
    <>
      {/* Hover Popup */}
      {showPopup && !isOpen && (
        <div
          className="fixed bottom-40 right-6 z-50 animate-fade-up"
          onMouseEnter={handleMouseEnterArea}
        >
          <div className="bg-background border border-border rounded-2xl p-3 shadow-xl max-w-[180px] relative">
            <button
              onClick={() => {
                setShowPopup(false);
                setPopupDismissed(true);
              }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/80"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                <img src={ashishiMascot} alt="Ashishi" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ashishi</p>
                <p className="text-xs text-muted-foreground mt-0.5">{popupMessage}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsOpen(true)}
              className="w-full mt-2 text-xs"
            >
              {language === "fr" ? "Discuter" : "Chat now"}
            </Button>
            {/* Arrow pointing down to button */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-r border-b border-border transform rotate-45" />
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <div
        className="fixed bottom-24 right-6 z-50"
        onMouseEnter={handleMouseEnterArea}
      >
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden",
            isOpen
              ? "bg-muted text-muted-foreground"
              : "bg-primary shadow-lg hover:scale-105"
          )}
          style={{ boxShadow: isOpen ? undefined : "var(--shadow-neu-raised), var(--shadow-red-glow)" }}
          aria-label={isOpen ? "Close Ashishi" : "Chat with Ashishi"}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <img src={ashishiMascot} alt="Ashishi" className="w-14 h-14 object-cover rounded-full" />
          )}
        </button>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-40 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-12rem)] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border animate-scale-in">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img src={ashishiMascot} alt="Ashishi" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-1">
                  Ashishi
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                </h3>
                <p className="text-xs opacity-80">
                  {language === "fr" ? "Votre assistant shopping" : "Your shopping assistant"}
                </p>
              </div>
            </div>
            <a
              href={`tel:${COMPANY_PHONE.replace(/\s/g, "")}`}
              className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
            >
              <Phone className="w-3 h-3" />
              {language === "fr" ? "Appeler" : "Call"}
            </a>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="bg-muted p-3 rounded-xl rounded-tl-none max-w-[85%] text-sm">
                <ReactMarkdown>{welcomeMessage}</ReactMarkdown>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("space-y-2", msg.role === "user" && "flex flex-col items-end")}>
                <div
                  className={cn(
                    "p-3 rounded-xl max-w-[85%] text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted rounded-tl-none prose prose-sm prose-p:m-0 prose-ul:m-0 prose-li:m-0 prose-strong:text-foreground"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {/* Product Cards for assistant messages */}
                {msg.role === "assistant" && msg.productCards && msg.productCards.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-[85%] scrollbar-thin scrollbar-thumb-muted">
                    {msg.productCards.map(card => (
                      <ProductCardItem key={card.id} card={card} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="bg-muted p-3 rounded-xl rounded-tl-none max-w-[85%] text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === "fr" ? "Ashishi réfléchit..." : "Ashishi is thinking..."}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === "fr" ? "Demandez à Ashishi..." : "Ask Ashishi..."}
              className="flex-1 px-4 py-2 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="rounded-full w-10 h-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
