// Pre-defined word lists by category
export const WORD_PRESETS = {
  classic: [
    'apple', 'airplane', 'banana', 'bicycle', 'bridge', 'candle', 'castle', 'cat',
    'clock', 'cloud', 'coffee', 'computer', 'diamond', 'dog', 'dolphin', 'door',
    'drum', 'elephant', 'eyeball', 'feather', 'fire', 'fish', 'flag', 'flower',
    'ghost', 'giraffe', 'glasses', 'guitar', 'hammer', 'hat', 'heart', 'helicopter',
    'house', 'island', 'jellyfish', 'key', 'kite', 'ladder', 'lamp', 'lemon',
    'lion', 'lollipop', 'magnet', 'moon', 'mountain', 'mushroom', 'octopus', 'owl',
    'paintbrush', 'palm tree', 'panda', 'pencil', 'penguin', 'piano', 'pizza', 'pyramid',
    'rainbow', 'robot', 'rocket', 'sandwich', 'scissors', 'shark', 'ship', 'shoe',
    'skull', 'snail', 'snowflake', 'snowman', 'spider', 'star', 'sun', 'sunglasses',
    'sword', 'telescope', 'tent', 'tiger', 'toothbrush', 'tornado', 'tree', 'trophy',
    'umbrella', 'volcano', 'watch', 'whale', 'windmill', 'zebra'
  ],
  animals: [
    'alligator', 'ant', 'bear', 'bee', 'butterfly', 'camel', 'cat', 'cheetah',
    'chicken', 'cow', 'crab', 'crocodile', 'deer', 'dog', 'dolphin', 'duck',
    'eagle', 'elephant', 'flamingo', 'fox', 'frog', 'giraffe', 'goat', 'gorilla',
    'hamster', 'hedgehog', 'hippopotamus', 'horse', 'kangaroo', 'koala', 'lion',
    'llama', 'lobster', 'monkey', 'mouse', 'octopus', 'ostrich', 'owl', 'panda',
    'parrot', 'peacock', 'penguin', 'pig', 'rabbit', 'rhino', 'scorpion', 'seal',
    'shark', 'sheep', 'sloth', 'snake', 'spider', 'squid', 'tiger', 'turtle',
    'whale', 'wolf', 'zebra'
  ],
  food: [
    'apple', 'avocado', 'bacon', 'banana', 'bread', 'broccoli', 'burger', 'cake',
    'candy', 'carrot', 'cheese', 'cherry', 'chocolate', 'cookie', 'corn', 'croissant',
    'cupcake', 'donut', 'egg', 'french fries', 'grapes', 'hotdog', 'ice cream',
    'lemon', 'lollipop', 'mango', 'mushroom', 'noodles', 'onion', 'pancake',
    'pasta', 'peach', 'peanut', 'pear', 'pie', 'pineapple', 'pizza', 'popcorn',
    'potato', 'salad', 'sandwich', 'sausage', 'sushi', 'taco', 'toast', 'tomato',
    'waffle', 'watermelon'
  ],
  objects: [
    'backpack', 'battery', 'book', 'bottle', 'bucket', 'camera', 'candle', 'chair',
    'clock', 'compass', 'couch', 'cup', 'cushion', 'door', 'envelope', 'flashlight',
    'fork', 'glasses', 'hammer', 'helmet', 'key', 'knife', 'ladder', 'lamp',
    'lock', 'magnet', 'map', 'mirror', 'mug', 'newspaper', 'padlock', 'pen',
    'pencil', 'pillow', 'plate', 'radio', 'ring', 'rope', 'scissors', 'shield',
    'shoe', 'shovel', 'spoon', 'suitcase', 'sword', 'telephone', 'telescope',
    'toothbrush', 'umbrella', 'wallet', 'watch', 'wheel'
  ],
  tech: [
    'algorithm', 'battery', 'browser', 'cable', 'camera', 'chip', 'code', 'computer',
    'cpu', 'database', 'display', 'drone', 'earphones', 'email', 'firewall',
    'gamepad', 'gpu', 'hard drive', 'headphones', 'internet', 'joystick', 'keyboard',
    'laptop', 'laser', 'microphone', 'modem', 'monitor', 'mouse', 'network',
    'password', 'phone', 'printer', 'processor', 'radar', 'radio', 'robot',
    'rocket', 'router', 'satellite', 'screen', 'server', 'smartphone', 'software',
    'speaker', 'tablet', 'telescope', 'vr headset', 'webcam', 'wifi'
  ]
};

export function getWordPool(preset = 'classic', customWords = '') {
  let words = [...(WORD_PRESETS[preset] || WORD_PRESETS.classic)];

  if (customWords && typeof customWords === 'string') {
    const customList = customWords
      .split(',')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 2 && w.length <= 25 && /^[a-zA-Z\s-]+$/.test(w));

    if (customList.length > 0) {
      words = [...words, ...customList];
    }
  }

  return [...new Set(words)]; // deduplicate
}

export function pickRandomWords(wordPool, count = 3, exclude = []) {
  const available = wordPool.filter(w => !exclude.includes(w));
  const pool = available.length >= count ? available : wordPool;
  
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
