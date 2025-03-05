"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";

type TreeNode = {
  board: BoardState; // Current board state
  score: number; // Score for this state
  move?: number; // Move that led to this state
  children: TreeNode[]; // Child states
};

type Player = "X" | "O" | null;
type BoardState = Player[];
type Difficulty = "Easy" | "Medium" | "Hard";

// Minimax scores
const SCORES = {
  X: -10, // Player wins (negative score for bot)
  O: 10, // Bot wins (positive score for bot)
  tie: 0, // Tie game
};

export default function TicTacToe() {
  const [botTree, setBotTree] = useState<TreeNode | null>(null);
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true); // X is always the player
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "tie">(
    "playing"
  );
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [showTree, setShowTree] = useState<boolean>(false);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset the game
  const resetGame = useCallback(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }

    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameStatus("playing");
    setWinner(null);
    setWinningLine(null);
    setBotTree(null); // Clear the tree
  }, []);

  // Check for winner
  const checkWinner = useCallback(
    (boardState: BoardState): { winner: Player; line: number[] | null } => {
      const lines = [
        [0, 1, 2], // top row
        [3, 4, 5], // middle row
        [6, 7, 8], // bottom row
        [0, 3, 6], // left column
        [1, 4, 7], // middle column
        [2, 5, 8], // right column
        [0, 4, 8], // diagonal top-left to bottom-right
        [2, 4, 6], // diagonal top-right to bottom-left
      ];

      for (const [a, b, c] of lines) {
        if (
          boardState[a] &&
          boardState[a] === boardState[b] &&
          boardState[a] === boardState[c]
        ) {
          return { winner: boardState[a], line: [a, b, c] };
        }
      }

      // Check for tie
      if (boardState.every((square) => square !== null)) {
        return { winner: null, line: null };
      }

      return { winner: null, line: null };
    },
    []
  );

  // Make a move
  const makeMove = useCallback(
    (index: number) => {
      if (board[index] || gameStatus !== "playing") return;

      const newBoard = [...board];
      newBoard[index] = isXNext ? "X" : "O";
      setBoard(newBoard);

      const { winner, line } = checkWinner(newBoard);
      if (winner) {
        setGameStatus("won");
        setWinner(winner);
        setWinningLine(line);
      } else if (newBoard.every((square) => square !== null)) {
        setGameStatus("tie");
      } else {
        setIsXNext(!isXNext);
      }
    },
    [board, gameStatus, isXNext, checkWinner]
  );

  // Get available moves
  const getAvailableMoves = useCallback((boardState: BoardState): number[] => {
    return boardState
      .map((square, index) => (square === null ? index : null))
      .filter((index): index is number => index !== null);
  }, []);

  // Minimax algorithm with alpha-beta pruning and depth limiting
  const minimax = useCallback(
    (
      boardState: BoardState,
      depth: number,
      isMaximizing: boolean,
      alpha = Number.NEGATIVE_INFINITY,
      beta: number = Number.POSITIVE_INFINITY
    ): { score: number; move?: number; tree?: TreeNode } => {
      const { winner } = checkWinner(boardState);

      // Terminal states
      if (winner === "X") return { score: SCORES.X };
      if (winner === "O") return { score: SCORES.O };
      if (boardState.every((square) => square !== null))
        return { score: SCORES.tie };
      if (depth === 0) return { score: 0 };

      const availableMoves = getAvailableMoves(boardState);
      const node: TreeNode = {
        board: [...boardState],
        score: isMaximizing
          ? Number.NEGATIVE_INFINITY
          : Number.POSITIVE_INFINITY,
        children: [],
      };

      if (isMaximizing) {
        let bestScore = Number.NEGATIVE_INFINITY;
        let bestMove: number | undefined;

        for (const move of availableMoves) {
          const newBoard = [...boardState];
          newBoard[move] = "O";

          const { score, tree } = minimax(
            newBoard,
            depth - 1,
            false,
            alpha,
            beta
          );

          const childNode = tree || {
            board: newBoard,
            score,
            move,
            children: [],
          };
          node.children.push(childNode);

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }

          alpha = Math.max(alpha, bestScore);
          if (beta <= alpha) break;
        }

        node.score = bestScore;
        node.move = bestMove;
        return { score: bestScore, move: bestMove, tree: node };
      } else {
        let bestScore = Number.POSITIVE_INFINITY;
        let bestMove: number | undefined;

        for (const move of availableMoves) {
          const newBoard = [...boardState];
          newBoard[move] = "X";

          const { score, tree } = minimax(
            newBoard,
            depth - 1,
            true,
            alpha,
            beta
          );

          const childNode = tree || {
            board: newBoard,
            score,
            move,
            children: [],
          };
          node.children.push(childNode);

          if (score < bestScore) {
            bestScore = score;
            bestMove = move;
          }

          beta = Math.min(beta, bestScore);
          if (beta <= alpha) break;
        }

        node.score = bestScore;
        node.move = bestMove;
        return { score: bestScore, move: bestMove, tree: node };
      }
    },
    [checkWinner, getAvailableMoves]
  );

  // Bot move logic
  const makeBotMove = useCallback(() => {
    if (gameStatus !== "playing") return;

    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return;

    let depth: number;
    switch (difficulty) {
      case "Easy":
        depth = 2;
        break;
      case "Medium":
        depth = 3;
        break;
      case "Hard":
        depth = 4;
        break;
      default:
        depth = 3;
    }

    const { move, tree } = minimax(board, depth, true);
    setBotTree(tree || null); // Store the tree for visualization

    if (move !== undefined) {
      makeMove(move);
    } else if (availableMoves.length > 0) {
      const randomMove =
        availableMoves[Math.floor(Math.random() * availableMoves.length)];
      makeMove(randomMove);
    }
  }, [board, difficulty, getAvailableMoves, makeMove, minimax, gameStatus]);

  // Bot's turn effect
  useEffect(() => {
    // If it's the bot's turn (O), make a move after a short delay
    if (!isXNext && gameStatus === "playing") {
      botTimeoutRef.current = setTimeout(() => {
        makeBotMove();
      }, 600); // Delay before bot makes a move
    }

    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = null;
      }
    };
  }, [isXNext, gameStatus, makeBotMove]);

  // Handle player click
  const handlePlayerClick = (index: number) => {
    // Only allow clicks when it's the player's turn (X) and the game is still playing
    if (isXNext && gameStatus === "playing" && !board[index]) {
      makeMove(index);
    }
  };

  // Reset game
  const startNewGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Start a game when component mounts
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Toggle tree visibility
  const toggleTreeVisibility = () => {
    setShowTree((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100svh] p-4 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tic-Tac-Toe</h1>

      {/* Game status */}
      <div className="mb-4 h-8 text-center">
        {gameStatus === "playing" ? (
          <div className="flex items-center justify-center gap-2">
            <span>Current turn:</span>
            <span
              className={`font-bold text-xl ${
                isXNext ? "text-blue-500" : "text-rose-500"
              }`}
            >
              {isXNext ? "You (X)" : "Bot (O)"}
            </span>
          </div>
        ) : gameStatus === "won" ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-2 font-bold text-emerald-500"
          >
            <Sparkles className="h-5 w-5" />
            <span>{winner === "X" ? "You win!" : "Bot wins!"}</span>
            <Sparkles className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-bold text-amber-500"
          >
            Game tied!
          </motion.div>
        )}
      </div>

      {/* Game board */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs aspect-square mb-6">
        {board.map((value, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: value ? 1 : 1.05 }}
            whileTap={{ scale: value ? 1 : 0.95 }}
            className={`flex items-center justify-center text-3xl font-bold aspect-square rounded-lg transition-colors
              ${
                value
                  ? "cursor-default"
                  : isXNext
                  ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  : "cursor-default"
              }
              ${
                value === "X"
                  ? "text-blue-500"
                  : value === "O"
                  ? "text-rose-500"
                  : ""
              }
              ${
                winningLine?.includes(index)
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-gray-200 dark:bg-gray-700"
              }
            `}
            onClick={() => handlePlayerClick(index)}
            disabled={!isXNext || gameStatus !== "playing" || !!value}
          >
            {value && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
              >
                {value}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Game controls */}
      <div className="w-full max-w-xs space-y-4">
        <div className="flex flex-col space-y-2">
          <span className="text-sm font-medium">Bot Difficulty:</span>
          <RadioGroup
            value={difficulty}
            onValueChange={(value) => {
              setDifficulty(value as Difficulty);
              if (gameStatus !== "playing") {
                startNewGame();
              }
            }}
            className="flex space-x-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="Easy" id="easy" />
              <Label htmlFor="easy">Easy</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="Medium" id="medium" />
              <Label htmlFor="medium">Medium</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="Hard" id="hard" />
              <Label htmlFor="hard">Hard</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={startNewGame}
            className="flex-1 bg-blue-500 hover:bg-blue-600"
          >
            New Game
          </Button>

          {botTree && (
            <Button
              onClick={toggleTreeVisibility}
              variant="outline"
              className="flex-1"
            >
              {showTree ? "Hide Tree" : "Show Tree"}
            </Button>
          )}
        </div>
      </div>

      {botTree && showTree && (
        <div className="mt-8 w-full overflow-auto">
          <h2 className="text-lg font-bold mb-4 text-center">Decision Tree</h2>
          <div className="overflow-x-auto pb-4">
            <div className="min-w-max">
              <TreeNode node={botTree} isRoot={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// TreeNode component for visualization
const TreeNode = ({
  node,
  isRoot = false,
  isBestMove = false,
}: {
  node: TreeNode;
  isRoot?: boolean;
  isBestMove?: boolean;
}) => {
  const [expanded, setExpanded] = useState(isRoot);

  // Find the best child node (for highlighting)
  const bestChildIndex =
    node.children.length > 0
      ? node.children.reduce((bestIdx, child, idx, arr) => {
          // For maximizing (O's turn), find max score
          // For minimizing (X's turn), find min score
          const isMaximizing =
            node.board.filter((cell) => cell !== null).length % 2 === 0;
          if (isMaximizing) {
            return child.score > arr[bestIdx].score ? idx : bestIdx;
          } else {
            return child.score < arr[bestIdx].score ? idx : bestIdx;
          }
        }, 0)
      : -1;

  return (
    <div className="tree-node">
      <div
        className={`flex flex-col items-center p-2 rounded-lg ${
          isBestMove
            ? "border-2 border-amber-400 dark:border-amber-600"
            : "border border-gray-300 dark:border-gray-700"
        }`}
      >
        {/* Board visualization */}
        <div className="grid grid-cols-3 gap-1 w-20 h-20">
          {node.board.map((value, index) => (
            <div
              key={index}
              className={`flex items-center justify-center text-sm font-bold ${
                value === "X"
                  ? "text-blue-500"
                  : value === "O"
                  ? "text-rose-500"
                  : "text-gray-400"
              } ${node.move === index ? "bg-gray-100 dark:bg-gray-800" : ""}`}
            >
              {value || "-"}
            </div>
          ))}
        </div>

        {/* Score */}
        <div
          className={`text-xs mt-1 font-medium ${
            node.score > 0
              ? "text-rose-500"
              : node.score < 0
              ? "text-blue-500"
              : "text-gray-500"
          }`}
        >
          Score: {node.score}
        </div>

        {/* Expand/collapse button (only if has children) */}
        {node.children.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {expanded ? (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                <span>Expand</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <div key={index} className="relative">
              {/* Connecting line */}
              <div className="absolute top-0 left-1/2 w-px h-4 -translate-x-1/2 bg-gray-300 dark:bg-gray-700"></div>
              <TreeNode node={child} isBestMove={index === bestChildIndex} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
