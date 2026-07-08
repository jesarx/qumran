package main

import "time"

type Book struct {
	ID          int        `db:"id"`
	Title       string     `db:"title"`
	ISBN        *string    `db:"isbn"`
	Author1ID   int        `db:"author1_id"`
	Author2ID   *int       `db:"author2_id"`
	PublisherID int        `db:"publisher_id"`
	CategoryID  int        `db:"category_id"`
	LocationID  *int       `db:"location_id"`
	Scanned     string     `db:"scanned"`
	CreatedAt   time.Time  `db:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at"`

	// Joined fields
	Author1FirstName *string `db:"author1_first_name"`
	Author1LastName  *string `db:"author1_last_name"`
	Author1Slug      *string `db:"author1_slug"`
	Author2FirstName *string `db:"author2_first_name"`
	Author2LastName  *string `db:"author2_last_name"`
	Author2Slug      *string `db:"author2_slug"`
	PublisherName    *string `db:"publisher_name"`
	PublisherSlug    *string `db:"publisher_slug"`
	CategoryName     *string `db:"category_name"`
	CategorySlug     *string `db:"category_slug"`
	LocationName     *string `db:"location_name"`
	LocationSlug     *string `db:"location_slug"`
}

type Author struct {
	ID        int       `db:"id"`
	FirstName *string   `db:"first_name"`
	LastName  string    `db:"last_name"`
	Slug      string    `db:"slug"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	BookCount int       `db:"book_count"`
}

type Publisher struct {
	ID        int       `db:"id"`
	Name      string    `db:"name"`
	Slug      string    `db:"slug"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	BookCount int       `db:"book_count"`
}

type Category struct {
	ID        int       `db:"id"`
	Name      string    `db:"name"`
	Slug      string    `db:"slug"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	BookCount int       `db:"book_count"`
}

type Location struct {
	ID        int       `db:"id"`
	Name      string    `db:"name"`
	Slug      string    `db:"slug"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	BookCount int       `db:"book_count"`
}

// Display helpers used by templates.

// DisplayName renders "Apellido, Nombre" like the Next app does.
func (a Author) DisplayName() string {
	if a.FirstName != nil && *a.FirstName != "" {
		return a.LastName + ", " + *a.FirstName
	}
	return a.LastName
}

func (b Book) Author1Display() string {
	name := deref(b.Author1LastName)
	if fn := deref(b.Author1FirstName); fn != "" {
		name += ", " + fn
	}
	return name
}

func (b Book) Author2Display() string {
	name := deref(b.Author2LastName)
	if fn := deref(b.Author2FirstName); fn != "" {
		name += ", " + fn
	}
	return name
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
