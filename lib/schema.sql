-- Create database (run this separately if needed)
-- CREATE DATABASE qumran;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS publishers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create authors table
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create publishers table
CREATE TABLE publishers (
    id SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    isbn VARCHAR(20), -- Removed UNIQUE constraint temporarily
    author1_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    author2_id INTEGER REFERENCES authors(id) ON DELETE RESTRICT,
    publisher_id INTEGER NOT NULL REFERENCES publishers(id) ON DELETE RESTRICT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Add constraint to check ISBN format if provided
    CONSTRAINT isbn_format_check CHECK (
        isbn IS NULL OR 
        (LENGTH(REGEXP_REPLACE(isbn, '[^0-9]', '', 'g')) IN (10, 13))
    )
);

-- Create unique index on ISBN, but only for non-null values
-- This allows multiple books without ISBN (NULL values)
CREATE UNIQUE INDEX idx_books_isbn_unique ON books(isbn) WHERE isbn IS NOT NULL;

-- Create other indexes for better performance
CREATE INDEX idx_books_author1_id ON books(author1_id);
CREATE INDEX idx_books_author2_id ON books(author2_id);
CREATE INDEX idx_books_publisher_id ON books(publisher_id);
CREATE INDEX idx_books_category_id ON books(category_id);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_authors_slug ON authors(slug);
CREATE INDEX idx_publishers_slug ON publishers(slug);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to normalize ISBN (remove hyphens and spaces)
CREATE OR REPLACE FUNCTION normalize_isbn(isbn_input VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF isbn_input IS NULL OR isbn_input = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN REGEXP_REPLACE(isbn_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically normalize ISBN on insert/update
CREATE OR REPLACE FUNCTION normalize_isbn_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.isbn = normalize_isbn(NEW.isbn);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_isbn_before_insert 
    BEFORE INSERT ON books
    FOR EACH ROW EXECUTE FUNCTION normalize_isbn_trigger();

CREATE TRIGGER normalize_isbn_before_update 
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION normalize_isbn_trigger();

-- Insert some initial categories
INSERT INTO categories ("name", slug) VALUES
    ('Filosofía', 'filosofia'),
    ('Narrativa', 'narrativa'),
    ('Música', 'musica'),
    ('Teatro', 'teatro'),
    ('Poesía', 'poesia'),
    ('Religión', 'religion'),
    ('Arte', 'arte'),
    ('Consulta', 'consulta');

-- Optional: Add some sample data to test the ISBN constraints
/*
-- This should work (books with ISBN)
INSERT INTO authors (first_name, last_name, slug) VALUES ('Test', 'Author', 'test-author');
INSERT INTO publishers (name, slug) VALUES ('Test Publisher', 'test-publisher');

-- Books with ISBN
INSERT INTO books (title, isbn, author1_id, publisher_id, category_id) VALUES 
    ('Test Book 1', '978-3-16-148410-0', 1, 1, 1),
    ('Test Book 2', '9781234567890', 1, 1, 1);

-- Books without ISBN (should work - multiple allowed)
INSERT INTO books (title, isbn, author1_id, publisher_id, category_id) VALUES 
    ('Test Book 3', NULL, 1, 1, 1),
    ('Test Book 4', NULL, 1, 1, 1);

-- This should fail (duplicate ISBN)
-- INSERT INTO books (title, isbn, author1_id, publisher_id, category_id) VALUES 
--     ('Test Book 5', '978-3-16-148410-0', 1, 1, 1);
*/
