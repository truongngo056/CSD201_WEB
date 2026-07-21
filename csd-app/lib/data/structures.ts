import type { DataStructureMeta, DSSlug, OperationDef } from "@/types";

const bi = (en: string, vi: string) => ({ en, vi });

function ops(list: OperationDef[]): OperationDef[] {
  return list;
}

export const DATA_STRUCTURES: DataStructureMeta[] = [
  {
    slug: "singly-linked-lists",
    name: "Singly Linked Lists",
    nameVi: "Danh sách liên kết đơn",
    shortName: "SLL",
    tagline: bi(
      "Learn how nodes connect sequentially.",
      "Học cách các node nối tuần tự một chiều."
    ),
    description: bi(
      "A linear collection of nodes where each node points only to the next node.",
      "Cấu trúc tuyến tính: mỗi node chỉ trỏ tới node kế tiếp."
    ),
    color: "sky",
    gradient: "from-sky-400 via-blue-500 to-cyan-500",
    icon: "Link",
    definition: bi(
      "A Singly Linked List (SLL) is a linear data structure made of nodes. Each node stores data and a next pointer to the following node. Traversal is one-way only: from head until null.",
      "Danh sách liên kết đơn (SLL) là cấu trúc dữ liệu tuyến tính gồm các node. Mỗi node lưu data và con trỏ next tới node sau. Chỉ duyệt một chiều: từ head đến null."
    ),
    howItWorks: bi(
      "The head reference points to the first node. To find the k-th element you walk next pointers k times. Insert at head rewires head in O(1). Insert at tail requires a full scan unless you keep a tail pointer.",
      "Con trỏ head trỏ node đầu. Tìm phần tử thứ k phải đi theo next k lần. Thêm đầu chỉ đổi head — O(1). Thêm cuối cần duyệt hết (trừ khi có tail)."
    ),
    keyTerms: [
      {
        term: "Node",
        en: "Unit with data + next",
        vi: "Đơn vị gồm data + next",
      },
      {
        term: "Head",
        en: "Reference to first node",
        vi: "Tham chiếu node đầu",
      },
      {
        term: "Null terminator",
        en: "Last next = null ends the list",
        vi: "next của node cuối = null",
      },
    ],
    characteristics: [
      bi("Each node: data + next", "Mỗi node: data + next"),
      bi("Head → first node", "Head → node đầu"),
      bi("Last node.next = null", "Node cuối.next = null"),
      bi("Dynamic size at runtime", "Kích thước động lúc chạy"),
      bi("Sequential access only", "Chỉ truy cập tuần tự"),
    ],
    advantages: [
      bi("Dynamic memory — no fixed capacity", "Bộ nhớ động — không cố định dung lượng"),
      bi("O(1) insert/delete at head", "Thêm/xóa đầu O(1)"),
      bi("Easy stack/queue building block", "Dễ dựng stack/queue"),
      bi("No wasted empty slots like arrays", "Không lãng phí ô trống như mảng"),
    ],
    disadvantages: [
      bi("Search / access by index is O(n)", "Tìm / truy cập theo chỉ số O(n)"),
      bi("Extra memory for pointers", "Tốn thêm bộ nhớ con trỏ"),
      bi("Cannot go backwards", "Không đi ngược được"),
      bi("Poor cache locality vs arrays", "Cache kém hơn mảng"),
    ],
    applications: [
      bi("Implementing stacks & queues", "Cài đặt stack & queue"),
      bi("Undo history", "Lịch sử Undo"),
      bi("Playlist (next track)", "Playlist (bài kế)"),
      bi("Hash table chaining", "Xử lý đụng độ bảng băm"),
      bi("Polynomial representation", "Biểu diễn đa thức"),
    ],
    complexity: {
      search: "O(n)",
      insert: "O(1) head / O(n) tail",
      delete: "O(1) head / O(n) search",
      access: "O(n)",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "addFirst",
        name: "addFirst",
        signature: "public void addFirst(int value)",
        description: bi(
          "Insert a new node at the beginning. New node becomes head.",
          "Chèn node mới vào đầu. Node mới trở thành head."
        ),
        javaCode: `public void addFirst(int value) {
    Node newNode = new Node(value);
    newNode.next = head;
    head = newNode;
    size++;
}`,
        pseudocode: `ADD_FIRST(x):
    node = CREATE_NODE(x)
    node.next = head
    head = node
    size = size + 1`,
        complexity: "O(1)",
        example: "addFirst(5) → HEAD → [5] → [10] → …",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "addLast",
        name: "addLast",
        signature: "public void addLast(int value)",
        description: bi(
          "Append at the end. Traverse to last node, then link.",
          "Thêm vào cuối. Duyệt tới node cuối rồi nối."
        ),
        javaCode: `public void addLast(int value) {
    Node newNode = new Node(value);
    if (head == null) {
        head = newNode;
    } else {
        Node curr = head;
        while (curr.next != null)
            curr = curr.next;
        curr.next = newNode;
    }
    size++;
}`,
        pseudocode: `ADD_LAST(x):
    node = CREATE_NODE(x)
    if head is null:
        head = node
    else:
        curr = head
        while curr.next ≠ null:
            curr = curr.next
        curr.next = node
    size = size + 1`,
        complexity: "O(n)",
        example: "addLast(50) → … → [40] → [50] → NULL",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "remove",
        name: "remove",
        signature: "public boolean remove(int value)",
        description: bi(
          "Find first node with value and unlink it via prev.next.",
          "Tìm node đầu tiên có value và gỡ bằng prev.next."
        ),
        javaCode: `public boolean remove(int value) {
    if (head == null) return false;
    if (head.data == value) {
        head = head.next;
        size--;
        return true;
    }
    Node prev = head;
    while (prev.next != null) {
        if (prev.next.data == value) {
            prev.next = prev.next.next;
            size--;
            return true;
        }
        prev = prev.next;
    }
    return false;
}`,
        pseudocode: `REMOVE(x):
    if head is null: return false
    if head.data = x:
        head = head.next
        return true
    prev = head
    while prev.next ≠ null:
        if prev.next.data = x:
            prev.next = prev.next.next
            return true
        prev = prev.next
    return false`,
        complexity: "O(n)",
        example: "remove(20) → HEAD → [10] → [30] → …",
        needsValue: true,
        valueLabel: bi("Value to remove", "Giá trị cần xóa"),
      },
      {
        id: "search",
        name: "search",
        signature: "public boolean search(int value)",
        description: bi(
          "Walk from head comparing each data field.",
          "Duyệt từ head, so sánh từng data."
        ),
        javaCode: `public boolean search(int value) {
    Node curr = head;
    while (curr != null) {
        if (curr.data == value)
            return true;
        curr = curr.next;
    }
    return false;
}`,
        pseudocode: `SEARCH(x):
    curr = head
    while curr ≠ null:
        if curr.data = x: return true
        curr = curr.next
    return false`,
        complexity: "O(n)",
        example: "search(30) → highlight path to [30]",
        needsValue: true,
        valueLabel: bi("Value to find", "Giá trị cần tìm"),
      },
      {
        id: "clear",
        name: "clear",
        signature: "public void clear()",
        description: bi(
          "Reset list: head = null, size = 0.",
          "Xóa list: head = null, size = 0."
        ),
        javaCode: `public void clear() {
    head = null;
    size = 0;
}`,
        pseudocode: `CLEAR():
    head = null
    size = 0`,
        complexity: "O(1)",
        example: "clear() → HEAD → NULL",
      },
    ]),
  },
  {
    slug: "doubly-linked-lists",
    name: "Doubly Linked Lists",
    nameVi: "Danh sách liên kết kép",
    shortName: "DLL",
    tagline: bi(
      "Navigate data in both directions.",
      "Duyệt dữ liệu hai chiều thuận/nghịch."
    ),
    description: bi(
      "Each node has prev and next pointers for bidirectional travel.",
      "Mỗi node có prev và next để đi hai chiều."
    ),
    color: "purple",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-500",
    icon: "ArrowLeftRight",
    definition: bi(
      "A Doubly Linked List stores data with both previous and next links. You can traverse forward from head or backward from tail. Deletion is O(1) when you already hold the node reference.",
      "Danh sách liên kết kép lưu data kèm liên kết prev và next. Có thể duyệt xuôi từ head hoặc ngược từ tail. Xóa O(1) nếu đã có tham chiếu node."
    ),
    howItWorks: bi(
      "Insert/delete rewires both directions: prev.next and next.prev. Keeping head and tail enables O(1) operations at both ends.",
      "Thêm/xóa phải nối lại cả hai phía: prev.next và next.prev. Giữ head + tail cho phép thao tác O(1) ở hai đầu."
    ),
    keyTerms: [
      { term: "prev", en: "Pointer to previous node", vi: "Con trỏ node trước" },
      { term: "next", en: "Pointer to next node", vi: "Con trỏ node sau" },
      { term: "Tail", en: "Last node (next = null)", vi: "Node cuối (next = null)" },
    ],
    characteristics: [
      bi("Node = prev + data + next", "Node = prev + data + next"),
      bi("head.prev = null, tail.next = null", "head.prev = null, tail.next = null"),
      bi("Bidirectional traversal", "Duyệt hai chiều"),
      bi("Can start from head or tail", "Bắt đầu từ head hoặc tail"),
    ],
    advantages: [
      bi("Forward & backward navigation", "Điều hướng xuôi & ngược"),
      bi("O(1) delete given node ref", "Xóa O(1) khi có ref node"),
      bi("Ideal for browser history UI", "Phù hợp lịch sử trình duyệt"),
      bi("Deque-friendly", "Thuận tiện cài Deque"),
    ],
    disadvantages: [
      bi("More memory (2 pointers)", "Tốn bộ nhớ hơn (2 con trỏ)"),
      bi("More complex link updates", "Cập nhật liên kết phức tạp hơn"),
      bi("Search still O(n)", "Tìm kiếm vẫn O(n)"),
    ],
    applications: [
      bi("Browser back/forward", "Nút Back/Forward trình duyệt"),
      bi("Music player prev/next", "Prev/next bài hát"),
      bi("LRU Cache", "Bộ nhớ đệm LRU"),
      bi("Text editor undo/redo", "Undo/redo soạn thảo"),
      bi("Deque", "Hàng đợi 2 đầu"),
    ],
    complexity: {
      search: "O(n)",
      insert: "O(1) ends / O(n) middle",
      delete: "O(1) given node / O(n) search",
      access: "O(n)",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "addFirst",
        name: "addFirst",
        signature: "public void addFirst(int value)",
        description: bi(
          "Insert at head; update next and prev.",
          "Chèn đầu; cập nhật next và prev."
        ),
        javaCode: `public void addFirst(int value) {
    Node n = new Node(value);
    n.next = head;
    if (head != null) head.prev = n;
    else tail = n;
    head = n;
    size++;
}`,
        pseudocode: `ADD_FIRST(x):
    n = CREATE_NODE(x)
    n.next = head
    if head ≠ null: head.prev = n
    else: tail = n
    head = n`,
        complexity: "O(1)",
        example: "addFirst(1) → HEAD ⇄ [1] ⇄ [5] ⇄ …",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "addLast",
        name: "addLast",
        signature: "public void addLast(int value)",
        description: bi(
          "Append at tail in O(1) via tail pointer.",
          "Thêm cuối O(1) nhờ con trỏ tail."
        ),
        javaCode: `public void addLast(int value) {
    Node n = new Node(value);
    n.prev = tail;
    if (tail != null) tail.next = n;
    else head = n;
    tail = n;
    size++;
}`,
        pseudocode: `ADD_LAST(x):
    n = CREATE_NODE(x)
    n.prev = tail
    if tail ≠ null: tail.next = n
    else: head = n
    tail = n`,
        complexity: "O(1)",
        example: "addLast(25) → … ⇄ [20] ⇄ [25] → NULL",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "remove",
        name: "remove",
        signature: "public boolean remove(int value)",
        description: bi(
          "Unlink first match by rewiring prev/next.",
          "Gỡ node khớp đầu tiên bằng nối lại prev/next."
        ),
        javaCode: `public boolean remove(int value) {
    Node curr = head;
    while (curr != null) {
        if (curr.data == value) {
            if (curr.prev != null) curr.prev.next = curr.next;
            else head = curr.next;
            if (curr.next != null) curr.next.prev = curr.prev;
            else tail = curr.prev;
            size--;
            return true;
        }
        curr = curr.next;
    }
    return false;
}`,
        pseudocode: `REMOVE(x):
    curr = head
    while curr ≠ null:
        if curr.data = x:
            rewire prev/next
            return true
        curr = curr.next
    return false`,
        complexity: "O(n)",
        example: "remove(10) → HEAD ⇄ [5] ⇄ [15] ⇄ …",
        needsValue: true,
        valueLabel: bi("Value to remove", "Giá trị cần xóa"),
      },
      {
        id: "search",
        name: "search",
        signature: "public boolean search(int value)",
        description: bi(
          "Forward scan from head.",
          "Duyệt xuôi từ head."
        ),
        javaCode: `public boolean search(int value) {
    Node curr = head;
    while (curr != null) {
        if (curr.data == value) return true;
        curr = curr.next;
    }
    return false;
}`,
        pseudocode: `SEARCH(x):
    curr = head
    while curr ≠ null:
        if curr.data = x: return true
        curr = curr.next
    return false`,
        complexity: "O(n)",
        example: "search(15) → highlight path",
        needsValue: true,
        valueLabel: bi("Value to find", "Giá trị cần tìm"),
      },
      {
        id: "clear",
        name: "clear",
        signature: "public void clear()",
        description: bi("Reset head and tail.", "Đặt head và tail về null."),
        javaCode: `public void clear() {
    head = tail = null;
    size = 0;
}`,
        pseudocode: `CLEAR():
    head = tail = null
    size = 0`,
        complexity: "O(1)",
        example: "clear() → empty list",
      },
    ]),
  },
  {
    slug: "circularly-linked-lists",
    name: "Circularly Linked Lists",
    nameVi: "Danh sách liên kết vòng",
    shortName: "CLL",
    tagline: bi(
      "Explore cyclic data structures.",
      "Khám phá cấu trúc dữ liệu vòng khép kín."
    ),
    description: bi(
      "Last node points back to head — continuous cycle.",
      "Node cuối trỏ về head — tạo vòng khép kín."
    ),
    color: "orange",
    gradient: "from-amber-400 via-orange-500 to-red-400",
    icon: "RefreshCw",
    definition: bi(
      "In a Circular Linked List the last node’s next points to the first node. There is no null end — you stop when you return to the start. Often implemented with a tail pointer for O(1) insert.",
      "Trong danh sách liên kết vòng, next của node cuối trỏ node đầu. Không có null kết thúc — dừng khi quay lại điểm xuất phát. Thường dùng tail để chèn O(1)."
    ),
    howItWorks: bi(
      "With tail: head = tail.next. Insert after tail then move tail. Traverse with do-while until curr returns to head.",
      "Có tail: head = tail.next. Chèn sau tail rồi dời tail. Duyệt do-while đến khi curr trở lại head."
    ),
    keyTerms: [
      { term: "Cycle", en: "Last → head forms a loop", vi: "Cuối → đầu tạo vòng" },
      { term: "Tail", en: "Often kept for O(1) ops", vi: "Giữ để thao tác O(1)" },
      {
        term: "do-while",
        en: "Safe one full lap traversal",
        vi: "Duyệt đúng một vòng an toàn",
      },
    ],
    characteristics: [
      bi("Last.next = head", "Last.next = head"),
      bi("No null terminator", "Không có null kết thúc"),
      bi("Can start at any node", "Bắt đầu từ node bất kỳ"),
      bi("Tail pointer common", "Thường dùng tail"),
    ],
    advantages: [
      bi("Natural round-robin", "Tự nhiên cho round-robin"),
      bi("Continuous cycling", "Lặp vòng liên tục"),
      bi("O(1) insert with tail", "Chèn O(1) với tail"),
      bi("Circular buffers", "Bộ đệm vòng"),
    ],
    disadvantages: [
      bi("Infinite loop risk", "Nguy cơ vòng lặp vô hạn"),
      bi("Harder end detection", "Khó nhận biết kết thúc"),
      bi("Slightly trickier code", "Code hơi phức tạp hơn"),
    ],
    applications: [
      bi("CPU round-robin scheduling", "Lập lịch CPU round-robin"),
      bi("Multiplayer turn order", "Lượt chơi nhiều người"),
      bi("Circular buffers", "Buffer vòng"),
      bi("Playlist loop mode", "Playlist lặp"),
      bi("Josephus problem", "Bài toán Josephus"),
    ],
    complexity: {
      search: "O(n)",
      insert: "O(1) with tail / O(n) otherwise",
      delete: "O(n)",
      access: "O(n)",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "addLast",
        name: "addLast",
        signature: "public void addLast(int value)",
        description: bi(
          "Insert after tail; reconnect circular link.",
          "Chèn sau tail; nối lại liên kết vòng."
        ),
        javaCode: `public void addLast(int value) {
    Node n = new Node(value);
    if (tail == null) {
        tail = n;
        n.next = n;
    } else {
        n.next = tail.next;
        tail.next = n;
        tail = n;
    }
    size++;
}`,
        pseudocode: `ADD_LAST(x):
    n = CREATE_NODE(x)
    if empty:
        tail = n; n.next = n
    else:
        n.next = tail.next
        tail.next = n
        tail = n`,
        complexity: "O(1)",
        example: "addLast(5) → cycle gains [5]",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "addFirst",
        name: "addFirst",
        signature: "public void addFirst(int value)",
        description: bi(
          "Insert at head position (right after tail).",
          "Chèn vị trí head (ngay sau tail)."
        ),
        javaCode: `public void addFirst(int value) {
    Node n = new Node(value);
    if (tail == null) {
        tail = n;
        n.next = n;
    } else {
        n.next = tail.next;
        tail.next = n;
    }
    size++;
}`,
        pseudocode: `ADD_FIRST(x):
    n = CREATE_NODE(x)
    if empty:
        tail = n; n.next = n
    else:
        n.next = tail.next
        tail.next = n`,
        complexity: "O(1)",
        example: "addFirst(0) → new head in cycle",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "remove",
        name: "remove",
        signature: "public boolean remove(int value)",
        description: bi(
          "Remove node while keeping the cycle valid.",
          "Xóa node nhưng vẫn giữ vòng hợp lệ."
        ),
        javaCode: `public boolean remove(int value) {
    if (tail == null) return false;
    Node curr = tail.next, prev = tail;
    do {
        if (curr.data == value) {
            if (curr == prev) tail = null;
            else {
                prev.next = curr.next;
                if (curr == tail) tail = prev;
            }
            size--;
            return true;
        }
        prev = curr;
        curr = curr.next;
    } while (curr != tail.next);
    return false;
}`,
        pseudocode: `REMOVE(x):
    traverse cycle
    if found: rewire prev.next
    preserve circular property`,
        complexity: "O(n)",
        example: "remove(2) → cycle without [2]",
        needsValue: true,
        valueLabel: bi("Value to remove", "Giá trị cần xóa"),
      },
      {
        id: "traverse",
        name: "traverse",
        signature: "public void traverse()",
        description: bi(
          "Walk one full lap from head back to head.",
          "Duyệt đúng một vòng từ head về head."
        ),
        javaCode: `public void traverse() {
    if (tail == null) return;
    Node curr = tail.next;
    do {
        System.out.print(curr.data + " ");
        curr = curr.next;
    } while (curr != tail.next);
}`,
        pseudocode: `TRAVERSE():
    if empty: return
    curr = head
    do:
        visit(curr)
        curr = curr.next
    while curr ≠ head`,
        complexity: "O(n)",
        example: "traverse() → glow each node",
      },
      {
        id: "clear",
        name: "clear",
        signature: "public void clear()",
        description: bi("Empty the circular list.", "Làm rỗng danh sách vòng."),
        javaCode: `public void clear() {
    tail = null;
    size = 0;
}`,
        pseudocode: `CLEAR():
    tail = null
    size = 0`,
        complexity: "O(1)",
        example: "clear() → empty cycle",
      },
    ]),
  },
  {
    slug: "stacks",
    name: "Stacks",
    nameVi: "Ngăn xếp",
    shortName: "Stack",
    tagline: bi(
      "Master Last In First Out operations.",
      "Làm chủ nguyên tắc Vào sau — Ra trước (LIFO)."
    ),
    description: bi(
      "LIFO structure — last pushed is first popped.",
      "Cấu trúc LIFO — phần tử push sau cùng được pop trước."
    ),
    color: "pink",
    gradient: "from-pink-400 via-rose-500 to-fuchsia-500",
    icon: "Layers",
    definition: bi(
      "A Stack follows LIFO (Last-In-First-Out). All insertions (push) and removals (pop) happen only at the top. It models nested calls, undo stacks, and DFS.",
      "Ngăn xếp tuân theo LIFO (Vào sau — Ra trước). Mọi thêm (push) và lấy (pop) chỉ ở đỉnh top. Mô hình lời gọi lồng nhau, undo, DFS."
    ),
    howItWorks: bi(
      "Array-based: top index grows on push, shrinks on pop. Linked-based: push/pop at head. Always O(1) for push, pop, peek when capacity allows.",
      "Mảng: chỉ số top tăng khi push, giảm khi pop. Linked: push/pop ở head. Luôn O(1) cho push/pop/peek nếu còn chỗ."
    ),
    keyTerms: [
      { term: "Top", en: "Only accessible end", vi: "Đầu duy nhất truy cập" },
      { term: "Push", en: "Insert at top", vi: "Thêm vào đỉnh" },
      { term: "Pop", en: "Remove from top", vi: "Lấy ra từ đỉnh" },
      { term: "Peek", en: "Read top without remove", vi: "Xem đỉnh, không xóa" },
    ],
    characteristics: [
      bi("LIFO order", "Thứ tự LIFO"),
      bi("Single access point: top", "Một điểm truy cập: top"),
      bi("Push / Pop / Peek", "Push / Pop / Peek"),
      bi("Array or linked implementation", "Cài bằng mảng hoặc linked"),
    ],
    advantages: [
      bi("Simple O(1) core ops", "Thao tác cốt lõi O(1) đơn giản"),
      bi("Perfect for nesting", "Lý tưởng cho cấu trúc lồng"),
      bi("Low overhead", "Chi phí thấp"),
      bi("Models recursion naturally", "Mô hình đệ quy tự nhiên"),
    ],
    disadvantages: [
      bi("No random access", "Không truy cập ngẫu nhiên"),
      bi("Only top is visible", "Chỉ thấy phần tử top"),
      bi("Array form may overflow", "Bản mảng có thể tràn"),
      bi("Fixed capacity if static array", "Dung lượng cố định nếu mảng tĩnh"),
    ],
    applications: [
      bi("Function call stack", "Ngăn xếp lời gọi hàm"),
      bi("Expression evaluation", "Tính biểu thức"),
      bi("Undo / redo", "Undo / redo"),
      bi("DFS traversal", "Duyệt DFS"),
      bi("Bracket matching", "Kiểm tra ngoặc"),
      bi("Browser back button", "Nút Back trình duyệt"),
    ],
    complexity: {
      search: "O(n)",
      insert: "O(1) push",
      delete: "O(1) pop",
      access: "O(1) peek",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "push",
        name: "push",
        signature: "public void push(int value)",
        description: bi(
          "Place element on top: top++; stack[top]=value.",
          "Đặt phần tử lên đỉnh: top++; stack[top]=value."
        ),
        javaCode: `public void push(int value) {
    if (top == capacity - 1)
        throw new StackOverflowError();
    stack[++top] = value;
}`,
        pseudocode: `PUSH(x):
    top = top + 1
    stack[top] = x`,
        complexity: "O(1)",
        example: "push(5) → [5] on top",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "pop",
        name: "pop",
        signature: "public int pop()",
        description: bi(
          "Remove and return top element.",
          "Gỡ và trả về phần tử top."
        ),
        javaCode: `public int pop() {
    if (isEmpty())
        throw new EmptyStackException();
    return stack[top--];
}`,
        pseudocode: `POP():
    if empty: error
    x = stack[top]
    top = top - 1
    return x`,
        complexity: "O(1)",
        example: "pop() → remove top",
      },
      {
        id: "peek",
        name: "peek",
        signature: "public int peek()",
        description: bi(
          "Read top without removing.",
          "Đọc top mà không xóa."
        ),
        javaCode: `public int peek() {
    if (isEmpty())
        throw new EmptyStackException();
    return stack[top];
}`,
        pseudocode: `PEEK():
    if empty: error
    return stack[top]`,
        complexity: "O(1)",
        example: "peek() → highlight top",
      },
      {
        id: "isEmpty",
        name: "isEmpty",
        signature: "public boolean isEmpty()",
        description: bi("True if top == -1.", "True nếu top == -1."),
        javaCode: `public boolean isEmpty() {
    return top == -1;
}`,
        pseudocode: `IS_EMPTY():
    return top = -1`,
        complexity: "O(1)",
        example: "isEmpty() → true/false",
      },
      {
        id: "size",
        name: "size",
        signature: "public int size()",
        description: bi("Number of elements = top + 1.", "Số phần tử = top + 1."),
        javaCode: `public int size() {
    return top + 1;
}`,
        pseudocode: `SIZE():
    return top + 1`,
        complexity: "O(1)",
        example: "size() → count",
      },
      {
        id: "clear",
        name: "clear",
        signature: "public void clear()",
        description: bi("Empty stack: top = -1.", "Làm rỗng: top = -1."),
        javaCode: `public void clear() {
    top = -1;
}`,
        pseudocode: `CLEAR():
    top = -1`,
        complexity: "O(1)",
        example: "clear() → empty",
      },
    ]),
  },
  {
    slug: "queues",
    name: "Queues",
    nameVi: "Hàng đợi",
    shortName: "Queue",
    tagline: bi(
      "Understand First In First Out processing.",
      "Hiểu xử lý Vào trước — Ra trước (FIFO)."
    ),
    description: bi(
      "FIFO structure — first enqueued is first dequeued.",
      "Cấu trúc FIFO — enqueue trước thì dequeue trước."
    ),
    color: "mint",
    gradient: "from-emerald-400 via-teal-500 to-cyan-400",
    icon: "ListOrdered",
    definition: bi(
      "A Queue follows FIFO (First-In-First-Out). Enqueue inserts at rear; dequeue removes from front. Models waiting lines, BFS, and buffering.",
      "Hàng đợi tuân theo FIFO (Vào trước — Ra trước). Enqueue thêm ở rear; dequeue lấy ở front. Mô hình xếp hàng, BFS, buffer."
    ),
    howItWorks: bi(
      "Two ends: front (exit) and rear (entry). Circular array avoids wasted slots after many dequeues. Linked queue uses head/tail nodes.",
      "Hai đầu: front (ra) và rear (vào). Mảng vòng tránh lãng phí sau nhiều dequeue. Queue linked dùng head/tail."
    ),
    keyTerms: [
      { term: "Front", en: "Removal end", vi: "Đầu lấy ra" },
      { term: "Rear", en: "Insertion end", vi: "Đầu thêm vào" },
      { term: "Enqueue", en: "Insert at rear", vi: "Thêm vào cuối" },
      { term: "Dequeue", en: "Remove from front", vi: "Lấy từ đầu" },
    ],
    characteristics: [
      bi("FIFO order", "Thứ tự FIFO"),
      bi("Front + Rear ends", "Hai đầu Front + Rear"),
      bi("Enqueue rear / Dequeue front", "Enqueue rear / Dequeue front"),
      bi("Array, linked, or circular buffer", "Mảng, linked, hoặc buffer vòng"),
    ],
    advantages: [
      bi("Fair processing order", "Thứ tự xử lý công bằng"),
      bi("O(1) enqueue & dequeue", "Enqueue & dequeue O(1)"),
      bi("Natural buffering model", "Mô hình buffer tự nhiên"),
      bi("Simple waiting-line abstraction", "Trừu tượng hàng chờ đơn giản"),
    ],
    disadvantages: [
      bi("No random access", "Không truy cập ngẫu nhiên"),
      bi("Array form can waste space", "Bản mảng có thể phí chỗ"),
      bi("Only ends are accessible", "Chỉ thao tác ở hai đầu"),
    ],
    applications: [
      bi("CPU / job scheduling", "Lập lịch CPU / job"),
      bi("Printer spooler", "Hàng đợi in"),
      bi("BFS graph traversal", "Duyệt đồ thị BFS"),
      bi("Message queues", "Hàng đợi thông điệp"),
      bi("Call center systems", "Hệ thống tổng đài"),
      bi("Keyboard buffer", "Buffer bàn phím"),
    ],
    complexity: {
      search: "O(n)",
      insert: "O(1) enqueue",
      delete: "O(1) dequeue",
      access: "O(1) front",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "enqueue",
        name: "enqueue",
        signature: "public void enqueue(int value)",
        description: bi(
          "Add element at rear.",
          "Thêm phần tử vào rear."
        ),
        javaCode: `public void enqueue(int value) {
    if (isFull()) throw new RuntimeException("Full");
    rear = (rear + 1) % capacity;
    data[rear] = value;
    size++;
}`,
        pseudocode: `ENQUEUE(x):
    if full: error
    rear = rear + 1
    queue[rear] = x`,
        complexity: "O(1)",
        example: "enqueue(5) → add at Rear",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "dequeue",
        name: "dequeue",
        signature: "public int dequeue()",
        description: bi(
          "Remove and return front element.",
          "Gỡ và trả về phần tử front."
        ),
        javaCode: `public int dequeue() {
    if (isEmpty()) throw new RuntimeException("Empty");
    int val = data[front];
    front = (front + 1) % capacity;
    size--;
    return val;
}`,
        pseudocode: `DEQUEUE():
    if empty: error
    x = queue[front]
    front = front + 1
    return x`,
        complexity: "O(1)",
        example: "dequeue() → remove Front",
      },
      {
        id: "front",
        name: "front",
        signature: "public int front()",
        description: bi(
          "Peek front without removing.",
          "Xem front, không xóa."
        ),
        javaCode: `public int front() {
    if (isEmpty()) throw new RuntimeException("Empty");
    return data[front];
}`,
        pseudocode: `FRONT():
    if empty: error
    return queue[front]`,
        complexity: "O(1)",
        example: "front() → highlight Front",
      },
      {
        id: "rear",
        name: "rear",
        signature: "public int rear()",
        description: bi(
          "Peek rear without removing.",
          "Xem rear, không xóa."
        ),
        javaCode: `public int rear() {
    if (isEmpty()) throw new RuntimeException("Empty");
    return data[rear];
}`,
        pseudocode: `REAR():
    if empty: error
    return queue[rear]`,
        complexity: "O(1)",
        example: "rear() → highlight Rear",
      },
      {
        id: "clear",
        name: "clear",
        signature: "public void clear()",
        description: bi("Empty the queue.", "Làm rỗng hàng đợi."),
        javaCode: `public void clear() {
    front = 0;
    rear = -1;
    size = 0;
}`,
        pseudocode: `CLEAR():
    front = 0; rear = -1; size = 0`,
        complexity: "O(1)",
        example: "clear() → empty",
      },
    ]),
  },
  {
    slug: "binary-trees",
    name: "Binary Trees",
    nameVi: "Cây nhị phân",
    shortName: "BT",
    tagline: bi(
      "Visualize hierarchical relationships.",
      "Trực quan hóa quan hệ phân cấp."
    ),
    description: bi(
      "Hierarchical structure: each node has ≤ 2 children.",
      "Cấu trúc phân cấp: mỗi node có tối đa 2 con."
    ),
    color: "green",
    gradient: "from-green-400 via-emerald-500 to-lime-500",
    icon: "GitBranch",
    definition: bi(
      "A Binary Tree is hierarchical: each node has at most two children (left, right). A Binary Search Tree (BST) keeps left < node < right, enabling logarithmic search when balanced.",
      "Cây nhị phân phân cấp: mỗi node tối đa 2 con (trái, phải). Cây nhị phân tìm kiếm (BST) giữ left < node < right, tìm kiếm logarit khi cân bằng."
    ),
    howItWorks: bi(
      "Insert/search compare with node and branch left/right. In-order traversal of BST yields sorted keys. Unbalanced trees can degrade to O(n).",
      "Insert/search so sánh với node rồi rẽ trái/phải. Duyệt trung tố BST cho dãy đã sắp. Cây lệch có thể xuống O(n)."
    ),
    keyTerms: [
      { term: "Root", en: "Top node", vi: "Node gốc" },
      { term: "Leaf", en: "Node with no children", vi: "Node không có con" },
      { term: "BST", en: "Left < node < right", vi: "Trái < node < phải" },
      {
        term: "Traversal",
        en: "pre / in / post / level order",
        vi: "tiền / trung / hậu / theo mức",
      },
    ],
    characteristics: [
      bi("At most 2 children per node", "Mỗi node tối đa 2 con"),
      bi("Root at the top", "Root ở đỉnh"),
      bi("BST: left < node < right", "BST: left < node < right"),
      bi("Height drives efficiency", "Chiều cao quyết định hiệu năng"),
      bi("4 main traversals", "4 kiểu duyệt chính"),
    ],
    advantages: [
      bi("Natural hierarchy model", "Mô hình phân cấp tự nhiên"),
      bi("O(log n) ops when balanced", "O(log n) khi cân bằng"),
      bi("Divide-and-conquer friendly", "Thuận divide-and-conquer"),
      bi("Flexible structure", "Cấu trúc linh hoạt"),
    ],
    disadvantages: [
      bi("Can skew to O(n)", "Có thể lệch thành O(n)"),
      bi("More complex than lists", "Phức tạp hơn list"),
      bi("No O(1) random access", "Không truy cập O(1) ngẫu nhiên"),
    ],
    applications: [
      bi("File systems", "Hệ thống tệp"),
      bi("Expression trees", "Cây biểu thức"),
      bi("Decision trees / ML", "Cây quyết định / ML"),
      bi("Syntax trees", "Cây cú pháp"),
      bi("Huffman coding", "Mã Huffman"),
    ],
    complexity: {
      search: "O(h) ≈ O(log n) bal. / O(n) worst",
      insert: "O(h)",
      delete: "O(h)",
      access: "O(h)",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "insert",
        name: "insert",
        signature: "public void insert(int value)",
        description: bi(
          "BST insert keeping left < node < right.",
          "Chèn BST giữ left < node < right."
        ),
        javaCode: `public void insert(int value) {
    root = insertRec(root, value);
}
private Node insertRec(Node node, int value) {
    if (node == null) return new Node(value);
    if (value < node.data)
        node.left = insertRec(node.left, value);
    else if (value > node.data)
        node.right = insertRec(node.right, value);
    return node;
}`,
        pseudocode: `INSERT(x):
    if root is null: root = x
    else walk tree:
        if x < node: go left
        else: go right
    place new leaf`,
        complexity: "O(h)",
        example: "insert(45) under 40",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "delete",
        name: "delete",
        signature: "public void delete(int value)",
        description: bi(
          "Delete leaf / one-child / two-child (successor).",
          "Xóa lá / 1 con / 2 con (dùng successor)."
        ),
        javaCode: `public void delete(int value) {
    root = deleteRec(root, value);
}
// 3 cases: leaf, one child, two children`,
        pseudocode: `DELETE(x):
    find node
    case 0 children: remove leaf
    case 1 child: replace with child
    case 2 children: replace with successor`,
        complexity: "O(h)",
        example: "delete(30) restructure",
        needsValue: true,
        valueLabel: bi("Value to delete", "Giá trị cần xóa"),
      },
      {
        id: "search",
        name: "search",
        signature: "public boolean search(int value)",
        description: bi(
          "Branch left/right until found or null.",
          "Rẽ trái/phải đến khi thấy hoặc null."
        ),
        javaCode: `public boolean search(int value) {
    Node curr = root;
    while (curr != null) {
        if (value == curr.data) return true;
        curr = value < curr.data ? curr.left : curr.right;
    }
    return false;
}`,
        pseudocode: `SEARCH(x):
    curr = root
    while curr ≠ null:
        if x = curr: return true
        if x < curr: go left
        else: go right
    return false`,
        complexity: "O(h)",
        example: "search(60) path highlight",
        needsValue: true,
        valueLabel: bi("Value to find", "Giá trị cần tìm"),
      },
      {
        id: "preOrder",
        name: "preOrder",
        signature: "public void preOrder()",
        description: bi("Root → Left → Right.", "Gốc → Trái → Phải."),
        javaCode: `public void preOrder(Node node) {
    if (node == null) return;
    visit(node);
    preOrder(node.left);
    preOrder(node.right);
}`,
        pseudocode: `PREORDER(node):
    if null: return
    visit(node)
    PREORDER(left)
    PREORDER(right)`,
        complexity: "O(n)",
        example: "50,30,20,40,70,60,80",
      },
      {
        id: "inOrder",
        name: "inOrder",
        signature: "public void inOrder()",
        description: bi(
          "Left → Root → Right (sorted for BST).",
          "Trái → Gốc → Phải (BST ra dãy tăng)."
        ),
        javaCode: `public void inOrder(Node node) {
    if (node == null) return;
    inOrder(node.left);
    visit(node);
    inOrder(node.right);
}`,
        pseudocode: `INORDER(node):
    if null: return
    INORDER(left)
    visit(node)
    INORDER(right)`,
        complexity: "O(n)",
        example: "20,30,40,50,60,70,80",
      },
      {
        id: "postOrder",
        name: "postOrder",
        signature: "public void postOrder()",
        description: bi("Left → Right → Root.", "Trái → Phải → Gốc."),
        javaCode: `public void postOrder(Node node) {
    if (node == null) return;
    postOrder(node.left);
    postOrder(node.right);
    visit(node);
}`,
        pseudocode: `POSTORDER(node):
    if null: return
    POSTORDER(left)
    POSTORDER(right)
    visit(node)`,
        complexity: "O(n)",
        example: "20,40,30,60,80,70,50",
      },
      {
        id: "levelOrder",
        name: "levelOrder",
        signature: "public void levelOrder()",
        description: bi(
          "BFS level by level using a queue.",
          "BFS từng mức bằng queue."
        ),
        javaCode: `public void levelOrder() {
    Queue<Node> q = new LinkedList<>();
    q.add(root);
    while (!q.isEmpty()) {
        Node n = q.poll();
        visit(n);
        if (n.left != null) q.add(n.left);
        if (n.right != null) q.add(n.right);
    }
}`,
        pseudocode: `LEVELORDER():
    queue.enqueue(root)
    while queue not empty:
        n = dequeue
        visit(n)
        enqueue children`,
        complexity: "O(n)",
        example: "50,30,70,20,40,60,80",
      },
    ]),
  },
  {
    slug: "balanced-search-trees",
    name: "Balanced Search Trees",
    nameVi: "Cây tìm kiếm cân bằng (AVL)",
    shortName: "AVL",
    tagline: bi(
      "Maintain efficient searching and insertion.",
      "Duy trì tìm kiếm và chèn hiệu quả."
    ),
    description: bi(
      "AVL self-balances after every update — height O(log n).",
      "AVL tự cân bằng sau mỗi cập nhật — chiều cao O(log n)."
    ),
    color: "yellow",
    gradient: "from-yellow-400 via-amber-500 to-orange-400",
    icon: "Scale",
    definition: bi(
      "An AVL Tree is a self-balancing BST. Balance Factor BF = height(left) − height(right) ∈ {−1, 0, +1} for every node. Rotations (LL, RR, LR, RL) restore balance after insert/delete.",
      "Cây AVL là BST tự cân bằng. Hệ số cân bằng BF = height(left) − height(right) ∈ {−1, 0, +1} với mọi node. Các phép xoay (LL, RR, LR, RL) khôi phục cân bằng sau insert/delete."
    ),
    howItWorks: bi(
      "After BST insert/delete, update heights up the path. If |BF| > 1, apply the matching single or double rotation. Guarantees O(log n) height.",
      "Sau insert/delete kiểu BST, cập nhật height dọc đường đi. Nếu |BF| > 1, xoay đơn hoặc kép tương ứng. Đảm bảo chiều cao O(log n)."
    ),
    keyTerms: [
      {
        term: "Balance Factor",
        en: "h(L) − h(R) ∈ {-1,0,1}",
        vi: "h(L) − h(R) ∈ {-1,0,1}",
      },
      { term: "LL / RR", en: "Single rotations", vi: "Xoay đơn" },
      { term: "LR / RL", en: "Double rotations", vi: "Xoay kép" },
    ],
    characteristics: [
      bi("BF ∈ {-1, 0, +1}", "BF ∈ {-1, 0, +1}"),
      bi("4 rotation cases", "4 trường hợp xoay"),
      bi("Strictly height-balanced", "Cân bằng chiều cao chặt"),
      bi("Guaranteed O(log n) ops", "Thao tác O(log n) chắc chắn"),
    ],
    advantages: [
      bi("Strict height bound", "Chặn chiều cao chặt"),
      bi("Faster lookups than skewed BST", "Tìm nhanh hơn BST lệch"),
      bi("Predictable performance", "Hiệu năng dự đoán được"),
      bi("Great for read-heavy maps", "Tốt cho map đọc nhiều"),
    ],
    disadvantages: [
      bi("More rotations than Red-Black", "Xoay nhiều hơn Red-Black"),
      bi("Slower writes than plain BST", "Ghi chậm hơn BST thường"),
      bi("Harder to implement", "Khó cài hơn"),
    ],
    applications: [
      bi("In-memory sorted maps", "Map sắp xếp trong bộ nhớ"),
      bi("Database indexes (related)", "Chỉ mục CSDL (liên quan)"),
      bi("Real-time systems", "Hệ thống thời gian thực"),
      bi("Priority dictionaries", "Từ điển ưu tiên"),
    ],
    complexity: {
      search: "O(log n)",
      insert: "O(log n)",
      delete: "O(log n)",
      access: "O(log n)",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "insert",
        name: "insert",
        signature: "public void insert(int value)",
        description: bi(
          "BST insert then rebalance with rotations.",
          "Chèn BST rồi cân bằng bằng xoay."
        ),
        javaCode: `public void insert(int value) {
    root = insertRec(root, value);
}
// After insert: update height, check BF,
// apply LL / RR / LR / RL rotations`,
        pseudocode: `INSERT(x):
    BST insert
    update heights
    if |BF| > 1: rotate
    LL → right rotation
    RR → left rotation
    LR → left then right
    RL → right then left`,
        complexity: "O(log n)",
        example: "insert may trigger rotation",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "delete",
        name: "delete",
        signature: "public void delete(int value)",
        description: bi(
          "BST delete then rebalance path to root.",
          "Xóa BST rồi cân bằng đường về root."
        ),
        javaCode: `public void delete(int value) {
    root = deleteRec(root, value);
}
// Rebalance after deletion`,
        pseudocode: `DELETE(x):
    BST delete
    rebalance path to root`,
        complexity: "O(log n)",
        example: "delete → rebalance",
        needsValue: true,
        valueLabel: bi("Value to delete", "Giá trị cần xóa"),
      },
      {
        id: "search",
        name: "search",
        signature: "public boolean search(int value)",
        description: bi(
          "Standard BST search — still O(log n).",
          "Tìm BST chuẩn — vẫn O(log n)."
        ),
        javaCode: `public boolean search(int value) {
    Node curr = root;
    while (curr != null) {
        if (value == curr.data) return true;
        curr = value < curr.data ? curr.left : curr.right;
    }
    return false;
}`,
        pseudocode: `SEARCH(x):
    standard BST search`,
        complexity: "O(log n)",
        example: "search path highlight",
        needsValue: true,
        valueLabel: bi("Value to find", "Giá trị cần tìm"),
      },
      {
        id: "leftRotation",
        name: "leftRotation",
        signature: "private Node leftRotate(Node y)",
        description: bi(
          "RR case: promote right child.",
          "Trường hợp RR: đưa con phải lên."
        ),
        javaCode: `private Node leftRotate(Node y) {
    Node x = y.right;
    Node T2 = x.left;
    x.left = y;
    y.right = T2;
    updateHeight(y);
    updateHeight(x);
    return x;
}`,
        pseudocode: `LEFT_ROTATE(y):
    x = y.right
    y.right = x.left
    x.left = y
    update heights
    return x`,
        complexity: "O(1)",
        example: "Demo left rotation",
      },
      {
        id: "rightRotation",
        name: "rightRotation",
        signature: "private Node rightRotate(Node y)",
        description: bi(
          "LL case: promote left child.",
          "Trường hợp LL: đưa con trái lên."
        ),
        javaCode: `private Node rightRotate(Node y) {
    Node x = y.left;
    Node T2 = x.right;
    x.right = y;
    y.left = T2;
    updateHeight(y);
    updateHeight(x);
    return x;
}`,
        pseudocode: `RIGHT_ROTATE(y):
    x = y.left
    y.left = x.right
    x.right = y
    update heights
    return x`,
        complexity: "O(1)",
        example: "Demo right rotation",
      },
      {
        id: "rebalance",
        name: "rebalance",
        signature: "private Node rebalance(Node node)",
        description: bi(
          "Check BF and apply LL/RR/LR/RL.",
          "Xem BF và áp dụng LL/RR/LR/RL."
        ),
        javaCode: `private Node rebalance(Node node) {
    int bf = balanceFactor(node);
    if (bf > 1 && balanceFactor(node.left) >= 0)
        return rightRotate(node); // LL
    if (bf < -1 && balanceFactor(node.right) <= 0)
        return leftRotate(node);  // RR
    if (bf > 1 && balanceFactor(node.left) < 0) {
        node.left = leftRotate(node.left); // LR
        return rightRotate(node);
    }
    if (bf < -1 && balanceFactor(node.right) > 0) {
        node.right = rightRotate(node.right); // RL
        return leftRotate(node);
    }
    return node;
}`,
        pseudocode: `REBALANCE(node):
    bf = height(L) - height(R)
    apply LL / RR / LR / RL`,
        complexity: "O(1)",
        example: "Show BF on nodes",
      },
    ]),
  },
  {
    slug: "heaps",
    name: "Heaps",
    nameVi: "Đống (Heap)",
    shortName: "Heap",
    tagline: bi(
      "Build powerful priority-based structures.",
      "Xây cấu trúc ưu tiên mạnh mẽ."
    ),
    description: bi(
      "Complete binary trees with min or max heap property.",
      "Cây nhị phân đầy đủ thỏa tính chất min/max heap."
    ),
    color: "coral",
    gradient: "from-rose-400 via-red-500 to-orange-500",
    icon: "Triangle",
    definition: bi(
      "A Heap is a complete binary tree: Max-Heap parents ≥ children; Min-Heap parents ≤ children. Usually stored in an array: parent at i, children at 2i+1 and 2i+2.",
      "Heap là cây nhị phân đầy đủ: Max-Heap cha ≥ con; Min-Heap cha ≤ con. Thường lưu mảng: cha ở i, con ở 2i+1 và 2i+2."
    ),
    howItWorks: bi(
      "Insert: append then bubble up. Extract: swap root with last, shrink, bubble down. buildHeap heapifies non-leaves bottom-up in O(n).",
      "Insert: thêm cuối rồi bubble up. Extract: đổi root với cuối, thu nhỏ, bubble down. buildHeap heapify non-leaf từ dưới lên O(n)."
    ),
    keyTerms: [
      {
        term: "Heap property",
        en: "Parent vs children order",
        vi: "Quan hệ thứ tự cha-con",
      },
      {
        term: "Bubble up/down",
        en: "Restore property after change",
        vi: "Khôi phục sau thay đổi",
      },
      {
        term: "Complete tree",
        en: "Filled level by level left→right",
        vi: "Lấp đầy từng mức trái→phải",
      },
    ],
    characteristics: [
      bi("Complete binary tree shape", "Hình dạng cây đầy đủ"),
      bi("Min-heap or Max-heap", "Min-heap hoặc Max-heap"),
      bi("Array: parent i, kids 2i+1, 2i+2", "Mảng: cha i, con 2i+1, 2i+2"),
      bi("Root is min or max", "Root là min hoặc max"),
    ],
    advantages: [
      bi("O(1) peek min/max", "Xem min/max O(1)"),
      bi("O(log n) insert/extract", "Insert/extract O(log n)"),
      bi("Ideal priority queue", "Hàng đợi ưu tiên lý tưởng"),
      bi("Cache-friendly array", "Mảng thân thiện cache"),
    ],
    disadvantages: [
      bi("No efficient arbitrary search", "Không tìm khóa tùy ý hiệu quả"),
      bi("Only extreme is ordered", "Chỉ cực trị được sắp"),
      bi("Not for full sorted iteration", "Không duyệt full đã sắp"),
    ],
    applications: [
      bi("Priority queues", "Hàng đợi ưu tiên"),
      bi("Heap Sort", "Sắp xếp Heap"),
      bi("Dijkstra / Prim", "Dijkstra / Prim"),
      bi("Job scheduling", "Lập lịch job"),
      bi("Median with two heaps", "Trung vị bằng 2 heap"),
    ],
    complexity: {
      search: "O(n)",
      insert: "O(log n)",
      delete: "O(log n) extract",
      access: "O(1) peek min/max",
      space: "O(n)",
    },
    sampleData: [],
    operations: ops([
      {
        id: "insert",
        name: "insert",
        signature: "public void insert(int value)",
        description: bi(
          "Append then bubble up to restore heap property.",
          "Thêm cuối rồi bubble up để giữ tính chất heap."
        ),
        javaCode: `public void insert(int value) {
    heap.add(value);
    bubbleUp(heap.size() - 1);
}
private void bubbleUp(int i) {
    while (i > 0) {
        int p = (i - 1) / 2;
        if (heap.get(i) <= heap.get(p)) break;
        swap(i, p);
        i = p;
    }
}`,
        pseudocode: `INSERT(x):
    append x at end
    BUBBLE_UP(last index)`,
        complexity: "O(log n)",
        example: "insert(95) bubble up",
        needsValue: true,
        valueLabel: bi("Value", "Giá trị"),
      },
      {
        id: "extractMax",
        name: "extractMax",
        signature: "public int extractMax()",
        description: bi(
          "Remove root max; last→root; bubble down.",
          "Gỡ root max; last→root; bubble down."
        ),
        javaCode: `public int extractMax() {
    int max = heap.get(0);
    int last = heap.remove(heap.size() - 1);
    if (!heap.isEmpty()) {
        heap.set(0, last);
        bubbleDown(0);
    }
    return max;
}`,
        pseudocode: `EXTRACT_MAX():
    max = root
    root = last element
    remove last
    BUBBLE_DOWN(0)
    return max`,
        complexity: "O(log n)",
        example: "extractMax → heapify",
      },
      {
        id: "extractMin",
        name: "extractMin",
        signature: "public int extractMin()",
        description: bi(
          "Min-heap: remove root minimum.",
          "Min-heap: gỡ root nhỏ nhất."
        ),
        javaCode: `public int extractMin() {
    int min = heap.get(0);
    // bubbleDown with min property
    return min;
}`,
        pseudocode: `EXTRACT_MIN():
    min = root
    root = last
    BUBBLE_DOWN(0)
    return min`,
        complexity: "O(log n)",
        example: "extractMin on min-heap",
      },
      {
        id: "heapify",
        name: "heapify",
        signature: "public void heapify(int i)",
        description: bi(
          "Bubble down from i to restore property.",
          "Bubble down từ i để khôi phục tính chất."
        ),
        javaCode: `public void heapify(int i) {
    int largest = i;
    int l = 2 * i + 1, r = 2 * i + 2;
    if (l < size && heap[l] > heap[largest]) largest = l;
    if (r < size && heap[r] > heap[largest]) largest = r;
    if (largest != i) {
        swap(i, largest);
        heapify(largest);
    }
}`,
        pseudocode: `HEAPIFY(i):
    find largest among i, left, right
    if largest ≠ i:
        swap(i, largest)
        HEAPIFY(largest)`,
        complexity: "O(log n)",
        example: "heapify(0)",
      },
      {
        id: "buildHeap",
        name: "buildHeap",
        signature: "public void buildHeap(int[] arr)",
        description: bi(
          "Bottom-up heapify non-leaves in O(n).",
          "Heapify non-leaf từ dưới lên O(n)."
        ),
        javaCode: `public void buildHeap(int[] arr) {
    heap = new ArrayList<>();
    for (int v : arr) heap.add(v);
    for (int i = size/2 - 1; i >= 0; i--)
        heapify(i);
}`,
        pseudocode: `BUILD_HEAP(arr):
    copy arr
    for i from ⌊n/2⌋-1 down to 0:
        HEAPIFY(i)`,
        complexity: "O(n)",
        example: "buildHeap array",
      },
      {
        id: "heapSort",
        name: "heapSort",
        signature: "public void heapSort()",
        description: bi(
          "Extract max repeatedly to sort ascending.",
          "Lấy max lặp lại để sắp tăng dần."
        ),
        javaCode: `public void heapSort() {
    buildHeap();
    for (int i = size - 1; i > 0; i--) {
        swap(0, i);
        size--;
        heapify(0);
    }
}`,
        pseudocode: `HEAP_SORT():
    BUILD_HEAP()
    for i = n-1 down to 1:
        swap(0, i)
        reduce heap size
        HEAPIFY(0)`,
        complexity: "O(n log n)",
        example: "heapSort → sorted",
      },
      {
        id: "toggleMode",
        name: "toggleMode",
        signature: "public void setMode(Mode m)",
        description: bi(
          "Switch Min ↔ Max heap and rebuild.",
          "Đổi Min ↔ Max heap rồi rebuild."
        ),
        javaCode: `public void setMode(Mode mode) {
    this.mode = mode;
    buildHeap();
}`,
        pseudocode: `SET_MODE(min|max):
    mode = min|max
    BUILD_HEAP()`,
        complexity: "O(n)",
        example: "Toggle Min ↔ Max",
      },
    ]),
  },
];

export function getStructure(slug: string): DataStructureMeta | undefined {
  return DATA_STRUCTURES.find((d) => d.slug === slug);
}

export function getAllSlugs(): DSSlug[] {
  return DATA_STRUCTURES.map((d) => d.slug);
}

export const COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string; glow: string; soft: string }
> = {
  sky: {
    bg: "bg-sky-500",
    text: "text-sky-500",
    border: "border-sky-500/40",
    glow: "shadow-sky-500/40",
    soft: "bg-sky-500/10",
  },
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-500",
    border: "border-purple-500/40",
    glow: "shadow-purple-500/40",
    soft: "bg-purple-500/10",
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/40",
    glow: "shadow-orange-500/40",
    soft: "bg-orange-500/10",
  },
  pink: {
    bg: "bg-pink-500",
    text: "text-pink-500",
    border: "border-pink-500/40",
    glow: "shadow-pink-500/40",
    soft: "bg-pink-500/10",
  },
  mint: {
    bg: "bg-teal-500",
    text: "text-teal-500",
    border: "border-teal-500/40",
    glow: "shadow-teal-500/40",
    soft: "bg-teal-500/10",
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-500",
    border: "border-green-500/40",
    glow: "shadow-green-500/40",
    soft: "bg-green-500/10",
  },
  yellow: {
    bg: "bg-amber-500",
    text: "text-amber-500",
    border: "border-amber-500/40",
    glow: "shadow-amber-500/40",
    soft: "bg-amber-500/10",
  },
  coral: {
    bg: "bg-rose-500",
    text: "text-rose-500",
    border: "border-rose-500/40",
    glow: "shadow-rose-500/40",
    soft: "bg-rose-500/10",
  },
};
