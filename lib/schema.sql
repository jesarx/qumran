--
-- PostgreSQL Database Schema
-- Book Library Management System
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS public;

--
-- Helper Functions
--

-- Function to normalize ISBN by removing non-numeric characters
CREATE OR REPLACE FUNCTION public.normalize_isbn(isbn_input character varying) 
RETURNS character varying
LANGUAGE plpgsql
AS $$
BEGIN
    IF isbn_input IS NULL OR isbn_input = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN REGEXP_REPLACE(isbn_input, '[^0-9]', '', 'g');
END;
$$;

-- Trigger function to normalize ISBN on insert/update
CREATE OR REPLACE FUNCTION public.normalize_isbn_trigger() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.isbn = normalize_isbn(NEW.isbn);
    RETURN NEW;
END;
$$;

-- Trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

--
-- Tables
--

-- Authors table
CREATE TABLE public.authors (
    id SERIAL PRIMARY KEY,
    first_name character varying(255),
    last_name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL UNIQUE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL UNIQUE,
    slug character varying(255) NOT NULL UNIQUE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Publishers table
CREATE TABLE public.publishers (
    id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL UNIQUE,
    slug character varying(255) NOT NULL UNIQUE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE public.locations (
    id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL UNIQUE,
    slug character varying(255) NOT NULL UNIQUE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE public.books (
    id SERIAL PRIMARY KEY,
    title character varying(500) NOT NULL,
    isbn character varying(20),
    author1_id integer NOT NULL,
    author2_id integer,
    publisher_id integer NOT NULL,
    category_id integer NOT NULL,
    location_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT isbn_format_check CHECK (
        (isbn IS NULL) OR 
        (length(regexp_replace((isbn)::text, '[^0-9]'::text, ''::text, 'g'::text)) = ANY (ARRAY[10, 13]))
    ),
    
    -- Foreign Keys
    CONSTRAINT books_author1_id_fkey FOREIGN KEY (author1_id) REFERENCES public.authors(id) ON DELETE RESTRICT,
    CONSTRAINT books_author2_id_fkey FOREIGN KEY (author2_id) REFERENCES public.authors(id) ON DELETE RESTRICT,
    CONSTRAINT books_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES public.publishers(id) ON DELETE RESTRICT,
    CONSTRAINT books_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT,
    CONSTRAINT books_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE RESTRICT
);

--
-- Indexes
--

-- Authors indexes
CREATE INDEX idx_authors_slug ON public.authors USING btree (slug);

-- Categories indexes
CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);

-- Publishers indexes
CREATE INDEX idx_publishers_slug ON public.publishers USING btree (slug);

-- Locations indexes
CREATE INDEX idx_locations_slug ON public.locations USING btree (slug);

-- Books indexes
CREATE INDEX idx_books_title ON public.books USING btree (title);
CREATE INDEX idx_books_isbn ON public.books USING btree (isbn);
CREATE UNIQUE INDEX idx_books_isbn_unique ON public.books USING btree (isbn) WHERE (isbn IS NOT NULL);
CREATE INDEX idx_books_author1_id ON public.books USING btree (author1_id);
CREATE INDEX idx_books_author2_id ON public.books USING btree (author2_id);
CREATE INDEX idx_books_publisher_id ON public.books USING btree (publisher_id);
CREATE INDEX idx_books_category_id ON public.books USING btree (category_id);
CREATE INDEX idx_books_location_id ON public.books USING btree (location_id);

--
-- Triggers
--

-- Triggers to automatically update updated_at timestamps
CREATE TRIGGER update_authors_updated_at 
    BEFORE UPDATE ON public.authors 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publishers_updated_at 
    BEFORE UPDATE ON public.publishers 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON public.locations 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at 
    BEFORE UPDATE ON public.books 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers to normalize ISBN on insert/update
CREATE TRIGGER normalize_isbn_before_insert 
    BEFORE INSERT ON public.books 
    FOR EACH ROW EXECUTE FUNCTION public.normalize_isbn_trigger();

CREATE TRIGGER normalize_isbn_before_update 
    BEFORE UPDATE ON public.books 
    FOR EACH ROW EXECUTE FUNCTION public.normalize_isbn_trigger();
