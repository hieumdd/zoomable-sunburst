# Zoomable Sunburst

- [Zoomable Sunburst](#zoomable-sunburst)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Data Requirements](#data-requirements)
      - [Sample Data Structure](#sample-data-structure)
    - [Formatting Options](#formatting-options)
      - [Font Size](#font-size)
      - [Arc Color](#arc-color)

## Installation

Import the `.pbivz` file into Power BI Desktop/Web

## Usage

### Data Requirements

There are 4 roles which will be needed for visual to function

| Role | Description | Required? | Nullable? | Max Columns | Column Type | Data Type |
|---|---|---|---|---|---|---|
| ID | ID for a single record | [x] | [ ] | 1 | Column | Preferably Numeric |
| Parent ID | ID for a single record's parent | [x] | [x] | 1 | Column | Preferably Numeric |
| Label | Label for Tooltip title | [ ] | [x] | Any | Any | Any |
| Value | Value for Conditional Formatting & Tooltip content | [ ] | Requires Column instead of Measure when there're null values | 1 | Preferably Column | Preferably Numeric |

#### Sample Data Structure

| id | parent_id | label | value
| --- | --- | --- | --- |
| 1 | | Root | 1
| 2 | 1 | Cat | 2
| 3 | 2 | Dog | 3

### Formatting Options

#### Font Size

Font size for Tooltip. Use in cases where font/visual proportion is undesirable.

#### Arc Color

Default Arc Color to use when no Conditional Formatting is applied.

The visual supports Conditional Formatting for these types of formats:

- Gradient
  - 2 colors
  - 3 colors
- Rule-based: For Rule-based Conditional Formatting to work, the data column that the visual is based on **must be the same as the data column for the `value` role**
