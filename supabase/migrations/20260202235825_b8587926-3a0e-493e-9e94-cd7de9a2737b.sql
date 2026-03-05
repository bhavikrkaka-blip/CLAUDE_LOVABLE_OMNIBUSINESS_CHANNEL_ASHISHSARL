-- Create customer profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name text,
    phone text,
    email text,
    address text,
    city text,
    avatar_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create shopping cart table
CREATE TABLE public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can view their own cart"
ON public.cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own cart"
ON public.cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
ON public.cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own cart"
ON public.cart_items FOR DELETE
USING (auth.uid() = user_id);

-- Create liked products table
CREATE TABLE public.liked_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS on liked_products
ALTER TABLE public.liked_products ENABLE ROW LEVEL SECURITY;

-- Liked products policies
CREATE POLICY "Users can view their liked products"
ON public.liked_products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can like products"
ON public.liked_products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike products"
ON public.liked_products FOR DELETE
USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount integer NOT NULL,
    payment_method text,
    payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    shipping_address text,
    shipping_city text,
    shipping_phone text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create order items table
CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    product_price integer NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order items follow parent order's access
CREATE POLICY "Users can view their order items"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert order items for their orders"
ON public.order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create product views tracking table for analytics
CREATE TABLE public.product_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on product_views
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (for tracking)
CREATE POLICY "Anyone can log product views"
ON public.product_views FOR INSERT
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can view product analytics"
ON public.product_views FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for cart_items updated_at
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();