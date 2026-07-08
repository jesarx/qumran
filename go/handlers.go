package main

import (
	"fmt"
	"net/http"
	"sort"
)

// RankedItem is a row in the "top authors/publishers" progress lists.
type RankedItem struct {
	Rank    int
	Name    string
	Count   int
	Percent float64 // width of the progress bar, relative to the top item
}

type CategoryStat struct {
	Name    string
	Slug    string
	Count   int
	Percent string // share of total books, e.g. "12.3"
}

type HomeData struct {
	TotalBooks          int
	TotalAuthors        int
	TotalPublishers     int
	TotalCategories     int
	AvgBooksPerAuthor   string
	AvgBooksPerPublisher string
	RecentBooks         []Book
	TopAuthors          []RankedItem
	TopPublishers       []RankedItem
	CategoryStats       []CategoryStat
}

func (app *application) homeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	booksData, err := app.db.GetBooks(ctx, BookFilters{Limit: 8, Sort: "-created_at"})
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	authorsData, err := app.db.GetAuthors(ctx, "", "-book_count", 1, 10)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	publishersData, err := app.db.GetPublishers(ctx, "", "-book_count", 1, 10)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	categories, err := app.db.GetCategories(ctx, "", "")
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	data := HomeData{
		TotalBooks:      booksData.Total,
		TotalAuthors:    authorsData.Total,
		TotalPublishers: publishersData.Total,
		TotalCategories: len(categories),
		RecentBooks:     booksData.Books,
	}
	if data.TotalAuthors > 0 {
		data.AvgBooksPerAuthor = fmt.Sprintf("%.1f", float64(data.TotalBooks)/float64(data.TotalAuthors))
	} else {
		data.AvgBooksPerAuthor = "0"
	}
	if data.TotalPublishers > 0 {
		data.AvgBooksPerPublisher = fmt.Sprintf("%.1f", float64(data.TotalBooks)/float64(data.TotalPublishers))
	} else {
		data.AvgBooksPerPublisher = "0"
	}

	if len(authorsData.Authors) > 0 {
		max := authorsData.Authors[0].BookCount
		if max < 1 {
			max = 1
		}
		for i, a := range authorsData.Authors {
			data.TopAuthors = append(data.TopAuthors, RankedItem{
				Rank:    i + 1,
				Name:    a.DisplayName(),
				Count:   a.BookCount,
				Percent: float64(a.BookCount) / float64(max) * 100,
			})
		}
	}
	if len(publishersData.Publishers) > 0 {
		max := publishersData.Publishers[0].BookCount
		if max < 1 {
			max = 1
		}
		for i, p := range publishersData.Publishers {
			data.TopPublishers = append(data.TopPublishers, RankedItem{
				Rank:    i + 1,
				Name:    p.Name,
				Count:   p.BookCount,
				Percent: float64(p.BookCount) / float64(max) * 100,
			})
		}
	}

	// Category distribution: top 6 with books, ordered by count desc.
	withBooks := make([]Category, 0, len(categories))
	for _, c := range categories {
		if c.BookCount > 0 {
			withBooks = append(withBooks, c)
		}
	}
	sort.Slice(withBooks, func(i, j int) bool { return withBooks[i].BookCount > withBooks[j].BookCount })
	if len(withBooks) > 6 {
		withBooks = withBooks[:6]
	}
	for _, c := range withBooks {
		pct := "0"
		if data.TotalBooks > 0 {
			pct = fmt.Sprintf("%.1f", float64(c.BookCount)/float64(data.TotalBooks)*100)
		}
		data.CategoryStats = append(data.CategoryStats, CategoryStat{
			Name: c.Name, Slug: c.Slug, Count: c.BookCount, Percent: pct,
		})
	}

	app.render(w, r, http.StatusOK, "home", templateData{Home: &data})
}
