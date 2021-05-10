import sys
import json
import argparse
import secrets
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt

FILLED = "filled"
CROSSED_OUT = "crossedOut"
BLANK = "blank"


def rgb_to_hex_color_string(r, g, b):
    return f'#{r:02x}{g:02x}{b:02x}'

def generate_nonogram_from_color_image(
    input_filename, width, height=None, threshold=128, title=None, secondary_title=None
):
    # normalizing arguments
    height = height or width

    # reading the color image file
    img = Image.open(input_filename)

    # converting the image to a black and white numpy array
    conversion_fn = lambda x : 255 if x < threshold else 0
    black_and_white_img = np.array(img.convert('L').point(conversion_fn, mode='1'))

    # downsizing the image to the desired height and width
    step_y = img.height // height
    step_x = img.width // width
    raw_solution = black_and_white_img[::step_y, ::step_x].tolist()
    raw_solution_colors = np.array(img)[::step_y, ::step_x, :3].tolist()

    # remove blank rows from the beginning and end
    for i in range(height):
        first_row = raw_solution[0]
        last_row = raw_solution[-1]
        if sum(first_row) == 0:
            raw_solution = raw_solution[1:]
            raw_solution_colors = raw_solution_colors[1:]
            height -= 1
        elif sum(last_row) == 0:
            raw_solution = raw_solution[:-1]
            raw_solution_colors = raw_solution_colors[:-1]
            height -= 1
        else:
            break

    # also remove blank columns from the beginning and end
    for i in range(width):
        first_col = [row[0] for row in raw_solution]
        last_col = [row[-1] for row in raw_solution]
        if sum(first_col) == 0:
            raw_solution = [row[1:] for row in raw_solution]
            raw_solution_colors = [row[1:] for row in raw_solution_colors]
            width -= 1
        elif sum(last_col) == 0:
            raw_solution = [row[:-1] for row in raw_solution]
            raw_solution_colors = [row[:-1] for row in raw_solution_colors]
            width -= 1
        else:
            break

    print('FINAL SHAPE =', height, 'x', width)

    # visualizing the downsized images as they would appear in a nonogram
    fig, axes = plt.subplots(1, 2, figsize=(12, 6))
    for ax in axes:
        ax.set_xticks(np.arange(-0.5, width + 1, 1))
        ax.set_yticks(np.arange(-0.5, height + 1, 1))
        ax.set_xticklabels(np.arange(1, width + 3, 1))
        ax.set_yticklabels(np.arange(1, height + 3, 1))
        ax.grid()

    axes[0].imshow(raw_solution, cmap='Greys')
    axes[1].imshow(raw_solution_colors)
    plt.show()

    # constructing the nonogram object
    nonogram = {
        'id': secrets.token_urlsafe(6).replace('-', '0').replace('_', '1'),
        'title': title,
        'secondaryTitle': secondary_title,
        'nextBoardId': None,
        'rowCounts': [],
        'colCounts': [],
        'cells': [[BLANK for _ in range(width)] for _ in range(height)],
        'solution': [[FILLED if cell else CROSSED_OUT for cell in row] for row in raw_solution],
        'solutionColors': [[rgb_to_hex_color_string(*cell) for cell in row] for row in raw_solution_colors],
    }

    for i in range(height):
        row_counts = []
        row_streak = 0
        for j in range(width):
            if raw_solution[i][j]:
                row_streak += 1
            elif row_streak > 0:
                row_counts.append(row_streak)
                row_streak = 0

        if row_streak > 0:
            row_counts.append(row_streak)
        nonogram['rowCounts'].append(row_counts)

        if len(row_counts) == 0:
            print(f'Warning: nonogram row {i} is blank', file=sys.stderr)

    for j in range(width):
        col_counts = []
        col_streak = 0
        for i in range(height):
            if raw_solution[i][j]:
                col_streak += 1
            elif col_streak > 0:
                col_counts.append(col_streak)
                col_streak = 0

        if col_streak > 0:
            col_counts.append(col_streak)
        nonogram['colCounts'].append(col_counts)

        if len(col_counts) == 0:
            print(f'Warning: nonogram col {j} is blank', file=sys.stderr)

    return nonogram

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generates a nonogram from a color image')
    parser.add_argument('filename')
    parser.add_argument('threshold', type=int, default=128, nargs='?')
    parser.add_argument('width', type=int, default=10, nargs='?')
    parser.add_argument('height', type=int, default=None, nargs='?')
    parser.add_argument('--title', type=str, default=None, nargs='?')
    parser.add_argument('--secondary_title', type=str, default=None, nargs='?')
    args = parser.parse_args()

    nonogram = generate_nonogram_from_color_image(
        input_filename=args.filename,
        width=args.width,
        height=args.height,
        threshold=args.threshold,
        title=args.title,
        secondary_title=args.secondary_title,
    )

    print(json.dumps(nonogram))
