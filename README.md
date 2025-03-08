# Tic-Tac-Toe Bot

A simple Tic-Tac-Toe bot using [Minimax](https://en.wikipedia.org/wiki/Minimax) Algorithm.

## How Minimax Works

The Minimax algorithm works by recursively evaluating game states. It alternates between maximizing the bot's score and minimizing the opponent's score. The algorithm assumes that both players are playing optimally.

1. **Maximizer**: The bot player tries to maximize its score.
2. **Minimizer**: The opponent tries to minimize the bot's score.
3. **Depth**: The number of moves ahead the algorithm looks. Deeper depth means more foresight but requires more computation.

## Depth Levels and Difficulty

The depth level directly impacts the bot's performance:

- **Low Depth (Easy)**: The bot looks 2 moves ahead.
- **Medium Depth**: The bot looks 4 moves ahead.
- **High Depth (Hard)**: The bot looks 8 moves ahead.

## Features

- **Play against an AI**: The bot uses the Minimax algorithm with alpha-beta pruning to make optimal moves.
- **Adjustable Difficulty**: Choose between three difficulty levels: Easy, Medium, and Hard.
- **Interactive Game Board**: Click on the board to make your moves. The game highlights the winning line when a player wins.
- **Decision Tree Visualization**: Visualize the bot's decision-making process with an interactive tree diagram.

## Built With

- **DeepSeek AI**: Used for generating and optimizing parts of the codebase, including the Minimax algorithm implementation and decision tree visualization.
- **v0**: Utilized for rapid prototyping and generating initial UI components.

## Github

Check out the [GitHub repository](https://github.com/pyaephyowinn/tic-tac-toe-bot) for this project.
