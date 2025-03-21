# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
|Fawzia Zeitoun|377613|
|Lina Obaid|382533|

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 <a name="milestone-1"></a>

**10% of the final grade**

### Datasets
Our project uses two main datasets sourced from Kaggle, both originating from BoardGameGeek (BGG), the largest online platform for board game enthusiasts.

#### Dataset 1: [BoardGameGeek Reviews](https://www.kaggle.com/datasets/jvanelteren/boardgamegeek-reviews).
This dataset contains detailed metadata for thousands of board games, including complexity, ratings, player counts, categories, expansions, and more. The data was scraped from BGG at multiple points in time. We will focus on the data from 2022 and 2025.


#### Dataset 2: [Board Game Ratings by Country](https://www.kaggle.com/datasets/thedevastator/board-game-ratings-by-country).
This dataset provides a snapshot of the board games on BGG in 2019. It provides the same metadata as dataset 1. However, it also includes the country of origin of the users with ratings.


### Problematic

Board games are more than entertainment; they are culture. From casual party games to deep strategic ones, the games we choose reflect how we connect, compete, and collaborate.
This project explores how board games have evolved across time and cultures. We focus on three distinct years (2019, 2022, and 2025) combining detailed metadata and user ratings from around the world.

Our goal is to analyze how board game design, complexity, popularity, and player engagement have changed globally. Key questions include:
* **Regional preferences**: Which countries prefer heavier, more complex games? Which lean toward lighter ones? What are the most popular categories in each country?
* **Temporal trends**: How have the game categories and settings shifted between 2019 and 2025? How did features like player count, playtime, or age suitability change over the years?
* **Analysis through global events**: With data from before and after the COVID-19 pandemic, as well as current-day data, did the pandemic influence game publishing, solo play, and category popularity? If so, how?
* **The anatomy of great games**: Are there consistent patterns or attributes that define or correlate with top-rated games?

By combining geographic insights with temporal trends and gameplay characteristics, our project aims to offer a multidimensional perspective on how board games, and the communities that play them, are evolving across the globe.

This project is intended for a broad audience, including data visualization enthusiasts, game designers, cultural researchers, and casual board gamers who are curious about global trends in play. Through interactive storytelling, we aim to make the data engaging and accessible to both technical and non-technical users.


### Exploratory Data Analysis
Key steps included renaming columns for consistency, removing unnecessary or invalid entries (e.g., missing ranks or empty categories), and converting stringified lists into proper Python lists. Only relevant features like name, rank, usersrated, and boardgamecategory were retained. User ratings were merged with country data after cleaning and standardizing the country field. These preprocessing steps ensured clean, consistent data for analysis and visualization.
The notebook contains graphs and visualizations exploring board game complexity, player count trends, game categories, and how these aspects have changed over time across the 2019, 2022, and 2025 datasets.

The preprocessing steps, dataset details, and exploratory data analysis are documented in the file [milestone1-eda.ipynb](./milestone1_eda.ipynb).


### Related Work
To our knowledge, we found no existing website or platform that provides a comprehensive, interactive visualization of global board game trends across time and geography. While some visualizations exist, such as individual graphs shared by users on BGG forums, these tend to be isolated and focused on only one aspect of the data. Most existing analyses we came across are limited to exploratory data analysis on platforms like Kaggle, such as the one [here](https://www.kaggle.com/code/jvanelteren/exploring-the-13m-reviews-bgg-dataset). They do not incorporate the full geographic or temporal perspective across the years.

For inspiration, we looked at several past projects of this course. The two projects that stood out to us were [GreenAce]( https://greenace.fdumoncel.ch/) and [Formula1]( https://formula1viz.altervista.org/index.html). We were particularly drawn to their use of interactive maps, which align with the global aspect of our project. Both websites also have a gamified feel, which we plan to integrate into our own website.


## Milestone 2 (18th April, 5pm)

**10% of the final grade**


## Milestone 3 (30th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

