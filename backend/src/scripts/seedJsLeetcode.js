import 'dotenv/config';
import mongoose from 'mongoose';
import LeetCodeProblem from '../modules/leetcode/leetcode-problem.model.js';

const JS_PROBLEMS = [
  { order: 1, no: 1, title: 'Two Sum', topic: 'Array, Hash Map', hints: [
    'Use a Map to store value→index as you iterate.',
    'For each num, check if map has (target - num) before adding.',
    'const map = new Map(); for (let i=0;i<nums.length;i++){const c=target-nums[i]; if(map.has(c)) return [map.get(c),i]; map.set(nums[i],i);}',
  ]},
  { order: 2, no: 258, title: 'Add Digits', topic: 'Math', hints: [
    'Repeatedly sum the digits until single digit — this is the digital root.',
    'Math formula (O(1)): num===0 ? 0 : 1+(num-1)%9',
    'JS loop: while(num>=10) num=[...String(num)].reduce((a,b)=>a+ +b,0);',
  ]},
  { order: 3, no: 344, title: 'Reverse String', topic: 'String, Two Pointers', hints: [
    'Modify in-place — do NOT return a new array.',
    'Two pointers: let l=0,r=s.length-1; while(l<r){[s[l],s[r]]=[s[r],s[l]];l++;r--;}',
    'Built-in: s.reverse() — check if allowed.',
  ]},
  { order: 4, no: 1342, title: 'Number of Steps to Reduce a Number to Zero', topic: 'Math, Bit Manipulation', hints: [
    'Loop while num>0: if even divide by 2, else subtract 1.',
    'Bit check: num&1 tells odd(1) or even(0). Bit shift: num>>>=1 divides by 2.',
    'let steps=0; while(num){num%2?num--:num>>=1; steps++;} return steps;',
  ]},
  { order: 5, no: 1295, title: 'Find Numbers with Even Number of Digits', topic: 'Array, Math', hints: [
    'Count digits: String(n).length or Math.floor(Math.log10(n))+1.',
    'Filter + count: nums.filter(n=>String(n).length%2===0).length',
    'Even number of digits means 2,4,6,... digit numbers (10-99, 1000-9999, etc.).',
  ]},
  { order: 6, no: 1108, title: 'Defanging an IP Address', topic: 'String', hints: [
    'Replace every "." with "[.]".',
    'One-liner: address.replaceAll(".", "[.]")',
    'Or: address.split(".").join("[.]")',
  ]},
  { order: 7, no: 1512, title: 'Number of Good Pairs', topic: 'Array, Hash Map', hints: [
    'A good pair: i<j and nums[i]===nums[j].',
    'For each number, count how many times it appeared before — each prior occurrence forms a pair.',
    'const freq={}; let count=0; for(const n of nums){count+=freq[n]||0; freq[n]=(freq[n]||0)+1;} return count;',
  ]},
  { order: 8, no: 26, title: 'Remove Duplicates from Sorted Array', topic: 'Array, Two Pointers', hints: [
    'Two pointers: slow (k) and fast (i). Move fast; if new value, write to slow.',
    'let k=1; for(let i=1;i<nums.length;i++) if(nums[i]!==nums[i-1]) nums[k++]=nums[i];',
    'In-place modification; return k (count of unique elements).',
  ]},
  { order: 9, no: 1528, title: 'Shuffle String', topic: 'Array, String', hints: [
    'Place each character at its target index.',
    'const res=Array(s.length); for(let i=0;i<s.length;i++) res[indices[i]]=s[i]; return res.join("");',
    'Or use spread: [...s].reduce((a,c,i)=>(a[indices[i]]=c,a),[]).join("")',
  ]},
  { order: 10, no: 1323, title: 'Maximum 69 Number', topic: 'Math, Greedy', hints: [
    'Replace the first (leftmost) 6 with 9 — that gives the biggest increase.',
    'String approach: String(num).replace("6","9") then +result.',
    'return +(String(num).replace("6","9"));',
  ]},
  { order: 11, no: 1672, title: 'Richest Customer Wealth', topic: 'Array, Matrix', hints: [
    'Sum each row (customer), then find the max row sum.',
    'accounts.reduce((max,row)=>Math.max(max,row.reduce((s,v)=>s+v,0)),0)',
    'Or: Math.max(...accounts.map(r=>r.reduce((s,v)=>s+v,0)))',
  ]},
  { order: 12, no: 35, title: 'Search Insert Position', topic: 'Array, Binary Search', hints: [
    'Binary search: find where target fits.',
    'let lo=0,hi=nums.length; while(lo<hi){const mid=lo+hi>>1; nums[mid]<target?lo=mid+1:hi=mid;} return lo;',
    'lo===hi at the end — that is the insert position.',
  ]},
  { order: 13, no: 1678, title: 'Goal Parser Interpretation', topic: 'String', hints: [
    'Replace "()" with "o" and "(al)" with "al".',
    'command.replaceAll("()","o").replaceAll("(al)","al")',
    'Or regex: command.replace(/\(\)/g,"o").replace(/\(al\)/g,"al")',
  ]},
  { order: 14, no: 1365, title: 'How Many Numbers Are Smaller Than the Current Number', topic: 'Array, Sorting, Hash Map', hints: [
    'For each nums[i], count how many elements are strictly smaller.',
    'Sort a copy, then use indexOf to get count (works because sorted array positions = count of smaller).',
    'const sorted=[...nums].sort((a,b)=>a-b); return nums.map(n=>sorted.indexOf(n));',
  ]},
  { order: 15, no: 1684, title: 'Count the Number of Consistent Strings', topic: 'Array, String, Hash Set', hints: [
    'A consistent string has all characters present in allowed.',
    'const allowed=new Set(allowed_str); words.filter(w=>[...w].every(c=>allowed.has(c))).length',
    'Or: words.reduce((cnt,w)=>cnt+([...w].every(c=>allowedSet.has(c))?1:0),0)',
  ]},
  { order: 16, no: 66, title: 'Plus One', topic: 'Array, Math', hints: [
    'Add 1 to the last digit. If it becomes 10, carry over.',
    'Iterate from end: if digit<9, increment and return. Else set to 0 and continue.',
    'If all digits were 9, prepend 1: return [1,...digits.map(()=>0)]',
  ]},
  { order: 17, no: 1662, title: 'Check If Two String Arrays are Equivalent', topic: 'Array, String', hints: [
    'Join each array into a full string and compare.',
    'return word1.join("") === word2.join("")',
  ]},
  { order: 18, no: 136, title: 'Single Number', topic: 'Array, Bit Manipulation', hints: [
    'XOR of a number with itself is 0; XOR with 0 is the number itself.',
    'XOR all elements: pairs cancel out, leaving the single number.',
    'return nums.reduce((a,b)=>a^b,0);',
  ]},
  { order: 19, no: 1523, title: 'Count Odd Numbers in an Interval Range', topic: 'Math', hints: [
    'Count odds from 0 to n: Math.ceil((n+1)/2) or (n>>1)+1 for odd n, n>>1 for even.',
    'Count in [low,high] = countOdds(high) - countOdds(low-1).',
    'Shortcut: Math.floor((high-low)/2)+1 if low is odd or high is odd, else Math.floor((high-low)/2).',
    'Simplest: return Math.floor((high+1)/2) - Math.floor(low/2);',
  ]},
  { order: 20, no: 1389, title: 'Create Target Array in the Given Order', topic: 'Array', hints: [
    'Insert nums[i] at position index[i] in the result array — use splice.',
    'const res=[]; for(let i=0;i<nums.length;i++) res.splice(index[i],0,nums[i]); return res;',
  ]},
  { order: 21, no: 1480, title: 'Running Sum of 1d Array', topic: 'Array, Prefix Sum', hints: [
    'Each result[i] = sum of nums[0..i].',
    'In-place: for(let i=1;i<nums.length;i++) nums[i]+=nums[i-1]; return nums;',
    'Or: nums.reduce((acc,v,i)=>(acc.push((acc[i-1]||0)+v),acc),[])',
  ]},
  { order: 22, no: 1431, title: 'Kids With the Greatest Number of Candies', topic: 'Array', hints: [
    'Find the current max, then check if each kid can reach it with extraCandies.',
    'const max=Math.max(...candies); return candies.map(c=>c+extraCandies>=max);',
  ]},
  { order: 23, no: 771, title: 'Jewels and Stones', topic: 'Hash Set, String', hints: [
    'Put jewel types in a Set, then count stones that are in the Set.',
    'const j=new Set(jewels); return [...stones].filter(s=>j.has(s)).length;',
    'Or: [...stones].reduce((cnt,s)=>cnt+(j.has(s)?1:0),0)',
  ]},
  { order: 24, no: 9, title: 'Palindrome Number', topic: 'Math', hints: [
    'Negative numbers and numbers ending in 0 (except 0) are never palindromes.',
    'String approach: const s=String(x); return s===s.split("").reverse().join("");',
    'Math approach: reverse the number and compare to original. No string conversion needed.',
  ]},
  { order: 25, no: 1816, title: 'Truncate Sentence', topic: 'String, Array', hints: [
    'Split by space, take first k words, join back.',
    'return s.split(" ").slice(0,k).join(" ");',
  ]},
  { order: 26, no: 1464, title: 'Maximum Product of Two Elements in an Array', topic: 'Array, Sorting', hints: [
    'Sort descending, take first two elements minus 1 each.',
    'return (nums.sort((a,b)=>b-a)[0]-1)*(nums[1]-1);',
    'Or find the two largest with a single pass to avoid sorting.',
  ]},
  { order: 27, no: 832, title: 'Flipping an Image', topic: 'Array, Two Pointers', hints: [
    'For each row: reverse it, then flip each bit (0→1, 1→0).',
    'Or combine: two pointers from both ends, XOR with 1 to flip.',
    'image.map(row=>[...row].reverse().map(b=>b^1))',
  ]},
  { order: 28, no: 2068, title: 'Check Whether Two Strings are Almost Equivalent', topic: 'String, Hash Map', hints: [
    'Count character frequencies in both strings, compare difference ≤ 3 for every char.',
    'const freq={}; for(const c of word1) freq[c]=(freq[c]||0)+1; for(const c of word2) freq[c]=(freq[c]||0)-1;',
    'return Object.values(freq).every(v=>Math.abs(v)<=3);',
  ]},
  { order: 29, no: 27, title: 'Remove Element', topic: 'Array, Two Pointers', hints: [
    'Two pointers: write pointer k and read pointer i.',
    'let k=0; for(const v of nums) if(v!==val) nums[k++]=v; return k;',
    'In-place, return count k — the first k elements are valid.',
  ]},
  { order: 30, no: 28, title: 'Find the Index of the First Occurrence in a String', topic: 'String, Two Pointers', hints: [
    'Built-in: haystack.indexOf(needle)',
    'Manual: slide a window of length needle.length across haystack and compare.',
    'return haystack.indexOf(needle); // simplest JS solution',
  ]},
  { order: 31, no: 20, title: 'Valid Parentheses', topic: 'String, Stack', hints: [
    'Use a stack. Push opening brackets; on closing, check if top matches.',
    'const map={")":"(","}":" {","]":"["}; const st=[];',
    'for(const c of s){if("({[".includes(c))st.push(c); else if(st.pop()!==map[c])return false;} return st.length===0;',
  ]},
  { order: 32, no: 58, title: 'Length of Last Word', topic: 'String', hints: [
    'Trim trailing spaces, split by space, return last word length.',
    'return s.trim().split(" ").at(-1).length;',
    'Or iterate from end skipping spaces, count non-space chars.',
  ]},
  { order: 33, no: 70, title: 'Climbing Stairs', topic: 'Dynamic Programming', hints: [
    'dp[i] = dp[i-1] + dp[i-2] — at each step you came from 1 or 2 steps below.',
    'Only need last two values: let a=1,b=1; for(let i=2;i<=n;i++){[a,b]=[b,a+b];} return b;',
    'This is Fibonacci — the (n+1)th Fibonacci number.',
  ]},
  { order: 34, no: 88, title: 'Merge Sorted Array', topic: 'Array, Two Pointers', hints: [
    'Merge from the END to avoid overwriting nums1.',
    'Three pointers: p1=m-1, p2=n-1, p=m+n-1.',
    'while(p2>=0) nums1[p--]=p1>=0&&nums1[p1]>nums2[p2]?nums1[p1--]:nums2[p2--];',
  ]},
  { order: 35, no: 118, title: 'Pascals Triangle', topic: 'Array, Dynamic Programming', hints: [
    'Each row starts and ends with 1. Middle values: triangle[i][j] = prev[j-1] + prev[j].',
    'Build row by row: const row=[1]; for(let j=1;j<i;j++) row.push(last[j-1]+last[j]); row.push(1);',
    'return Array.from({length:numRows},(_,i)=>Array.from({length:i+1},(_,j)=>j===0||j===i?1:res[i-1][j-1]+res[i-1][j]));',
  ]},
  { order: 36, no: 121, title: 'Best Time to Buy and Sell Stock', topic: 'Array, Dynamic Programming', hints: [
    'Track the minimum price seen so far and maximum profit.',
    'let minPrice=Infinity,maxProfit=0; for(const p of prices){minPrice=Math.min(minPrice,p); maxProfit=Math.max(maxProfit,p-minPrice);}',
    'One pass O(n) — no need for nested loops.',
  ]},
  { order: 37, no: 125, title: 'Valid Palindrome', topic: 'String, Two Pointers', hints: [
    'Filter alphanumeric chars, lowercase, then check palindrome.',
    'const clean=s.toLowerCase().replace(/[^a-z0-9]/g,""); return clean===clean.split("").reverse().join("");',
    'Two-pointer approach: skip non-alphanumeric with /[^a-z0-9]/.test(c).',
  ]},
  { order: 38, no: 168, title: 'Excel Sheet Column Title', topic: 'Math, String', hints: [
    'It is base-26 but 1-indexed (no zero — A=1, Z=26).',
    'While n>0: decrement n by 1 (to handle 1-index), take n%26 as char, n=Math.floor(n/26).',
    'let res=""; while(n){n--; res=String.fromCharCode(65+n%26)+res; n=Math.floor(n/26);} return res;',
  ]},
  { order: 39, no: 171, title: 'Excel Sheet Column Number', topic: 'Math, String', hints: [
    'Reverse of 168 — base-26 number where A=1 ... Z=26.',
    'Process left to right: result = result*26 + (charCode-64).',
    'return [...columnTitle].reduce((acc,c)=>acc*26+(c.charCodeAt(0)-64),0);',
  ]},
  { order: 40, no: 202, title: 'Happy Number', topic: 'Math, Hash Set', hints: [
    'Repeatedly replace n with sum of squares of its digits.',
    'Use a Set to detect cycles — if n seen before, return false; if n===1, return true.',
    'const sumSq=n=>[...String(n)].reduce((s,d)=>s+d*d,0);',
    'const seen=new Set(); while(n!==1&&!seen.has(n)){seen.add(n);n=sumSq(n);} return n===1;',
  ]},
  { order: 41, no: 205, title: 'Isomorphic Strings', topic: 'String, Hash Map', hints: [
    'Map each char in s to char in t AND each char in t back to s (bidirectional mapping).',
    'const mapST={},mapTS={}; for(let i=0;i<s.length;i++){const [a,b]=[s[i],t[i]]; if(mapST[a]&&mapST[a]!==b||mapTS[b]&&mapTS[b]!==a)return false; mapST[a]=b;mapTS[b]=a;}',
    'return true;',
  ]},
  { order: 42, no: 217, title: 'Contains Duplicate', topic: 'Array, Hash Set', hints: [
    'Use a Set — if adding a value that already exists, return true.',
    'return new Set(nums).size !== nums.length;',
    'Or loop: const s=new Set(); for(const n of nums){if(s.has(n))return true; s.add(n);}',
  ]},
  { order: 43, no: 219, title: 'Contains Duplicate II', topic: 'Array, Hash Map, Sliding Window', hints: [
    'Use a Map of value→lastIndex. If seen within distance k, return true.',
    'const map=new Map(); for(let i=0;i<nums.length;i++){if(map.has(nums[i])&&i-map.get(nums[i])<=k)return true; map.set(nums[i],i);}',
    'Sliding window alternative: maintain a Set of the last k elements.',
  ]},
  { order: 44, no: 228, title: 'Summary Ranges', topic: 'Array, Two Pointers', hints: [
    'Walk the array, extend the range while consecutive, output when broken.',
    'let i=0; while(i<nums.length){let j=i; while(j+1<nums.length&&nums[j+1]===nums[j]+1)j++; push i===j?`${nums[i]}`:`${nums[i]}->${nums[j]}`; i=j+1;}',
  ]},
  { order: 45, no: 231, title: 'Power of Two', topic: 'Math, Bit Manipulation', hints: [
    'A power of two has exactly one bit set in binary.',
    'Bit trick: n>0 && (n&(n-1))===0 — subtracting 1 flips all bits from rightmost set bit.',
    'return n>0 && (n&n-1)===0;',
  ]},
  { order: 46, no: 242, title: 'Valid Anagram', topic: 'String, Hash Map', hints: [
    'Same length + same character frequencies = anagram.',
    'Sort both strings and compare: s.split("").sort().join("") === t.split("").sort().join("")',
    'Or use a frequency map: count chars in s, decrement for t, check all zeros.',
  ]},
  { order: 47, no: 263, title: 'Ugly Number', topic: 'Math', hints: [
    'Ugly numbers have only 2, 3, 5 as prime factors.',
    'Divide by 2, 3, and 5 while divisible. If result is 1, it is ugly.',
    'for(const f of [2,3,5]) while(n%f===0) n/=f; return n===1;',
  ]},
  { order: 48, no: 283, title: 'Move Zeroes', topic: 'Array, Two Pointers', hints: [
    'Two pointers: move non-zero elements to front, fill rest with zeros.',
    'let k=0; for(const n of nums) if(n!==0) nums[k++]=n; while(k<nums.length) nums[k++]=0;',
    'Or: swap zeros with non-zeros in-place without filling at end.',
  ]},
  { order: 49, no: 290, title: 'Word Pattern', topic: 'String, Hash Map', hints: [
    'Same as isomorphic strings — bidirectional mapping between pattern chars and words.',
    'const words=s.split(" "); if(words.length!==pattern.length)return false;',
    'Map each char→word and word→char; check consistency both ways.',
  ]},
  { order: 50, no: 292, title: 'Nim Game', topic: 'Math, Game Theory', hints: [
    'If n is a multiple of 4, the first player loses; otherwise wins.',
    'Proof: multiples of 4 are losing positions — whatever you take (1,2,3), opponent takes rest to reach next multiple of 4.',
    'return n%4!==0;',
  ]},
  { order: 51, no: 326, title: 'Power of Three', topic: 'Math', hints: [
    'Divide by 3 while divisible; check remainder is 1.',
    'while(n%3===0) n/=3; return n===1;',
    'Math trick: 3^19 = 1162261467 is the largest power of 3 in int range. return n>0&&1162261467%n===0;',
  ]},
  { order: 52, no: 345, title: 'Reverse Vowels of a String', topic: 'String, Two Pointers', hints: [
    'Two pointers from both ends; swap vowels only.',
    'const vowels=new Set("aeiouAEIOU"); const a=[...s]; let l=0,r=a.length-1;',
    'while(l<r){while(l<r&&!vowels.has(a[l]))l++; while(l<r&&!vowels.has(a[r]))r--; [a[l],a[r]]=[a[r],a[l]]; l++;r--;} return a.join("");',
  ]},
  { order: 53, no: 349, title: 'Intersection of Two Arrays', topic: 'Array, Set', hints: [
    'Result must have unique elements. Use two Sets.',
    'const s1=new Set(nums1); return [...new Set(nums2)].filter(n=>s1.has(n));',
  ]},
  { order: 54, no: 350, title: 'Intersection of Two Arrays II', topic: 'Array, Hash Map', hints: [
    'Duplicates matter here. Count frequencies of the shorter array, decrement for the other.',
    'const map={}; for(const n of nums1) map[n]=(map[n]||0)+1;',
    'return nums2.filter(n=>map[n]-->0);',
  ]},
  { order: 55, no: 367, title: 'Valid Perfect Square', topic: 'Math, Binary Search', hints: [
    'Binary search for sqrt: lo=1,hi=num; mid*mid===num→true.',
    'let lo=1,hi=num; while(lo<=hi){const mid=lo+hi>>1; const sq=mid*mid; if(sq===num)return true; sq<num?lo=mid+1:hi=mid-1;} return false;',
    'Or: Math.sqrt(num)%1===0 — check if square root is integer.',
  ]},
  { order: 56, no: 383, title: 'Ransom Note', topic: 'String, Hash Map', hints: [
    'Count chars in magazine; check ransomNote has enough of each.',
    'const mag={}; for(const c of magazine) mag[c]=(mag[c]||0)+1;',
    'for(const c of ransomNote){if(!mag[c])return false; mag[c]--;} return true;',
  ]},
  { order: 57, no: 387, title: 'First Unique Character in a String', topic: 'String, Hash Map', hints: [
    'Count char frequencies, then find first char with count===1.',
    'const freq={}; for(const c of s) freq[c]=(freq[c]||0)+1;',
    'for(let i=0;i<s.length;i++) if(freq[s[i]]===1) return i; return -1;',
  ]},
  { order: 58, no: 389, title: 'Find the Difference', topic: 'String, Bit Manipulation', hints: [
    'XOR all chars in both strings — duplicate chars cancel, extra char remains.',
    'let x=0; for(const c of s+t) x^=c.charCodeAt(0); return String.fromCharCode(x);',
    'Alt: sum charCodes of t minus sum of s, convert result back to char.',
  ]},
  { order: 59, no: 392, title: 'Is Subsequence', topic: 'String, Two Pointers', hints: [
    'Walk through s with pointer i; for each char find it in t using pointer j.',
    'let i=0; for(const c of t){if(i<s.length&&c===s[i])i++;} return i===s.length;',
  ]},
  { order: 60, no: 409, title: 'Longest Palindrome', topic: 'String, Hash Map', hints: [
    'All even-frequency chars can be fully used. One odd-frequency char can go in the center.',
    'Count frequencies. Sum all even counts + (each odd count - 1). Add 1 if any odd freq exists.',
    'const freq={}; for(const c of s) freq[c]=(freq[c]||0)+1; let len=0,odd=0; for(const v of Object.values(freq)){len+=v%2===0?v:v-1; if(v%2)odd=1;} return len+odd;',
  ]},
  { order: 61, no: 412, title: 'Fizz Buzz', topic: 'Math, String', hints: [
    'For 1..n: divisible by 15 → FizzBuzz, by 3 → Fizz, by 5 → Buzz, else n.',
    'return Array.from({length:n},(_,i)=>{const n=i+1; return n%15===0?"FizzBuzz":n%3===0?"Fizz":n%5===0?"Buzz":String(n);});',
  ]},
  { order: 62, no: 414, title: 'Third Maximum Number', topic: 'Array, Set', hints: [
    'Use a Set to remove duplicates, sort descending, return index 2 (or index 0 if fewer than 3).',
    'const s=[...new Set(nums)].sort((a,b)=>b-a); return s.length>=3?s[2]:s[0];',
  ]},
  { order: 63, no: 415, title: 'Add Strings', topic: 'String, Simulation', hints: [
    'Simulate addition right to left using two pointers and a carry.',
    'let i=num1.length-1,j=num2.length-1,carry=0,res="";',
    'while(i>=0||j>=0||carry){const sum=(i>=0?+num1[i--]:0)+(j>=0?+num2[j--]:0)+carry; res=(sum%10)+res; carry=sum/10|0;} return res;',
  ]},
  { order: 64, no: 434, title: 'Number of Segments in a String', topic: 'String', hints: [
    'Split by whitespace and count non-empty parts.',
    'return s.trim().split(/\\s+/).filter(Boolean).length;',
    'Or count transitions from space to non-space.',
  ]},
  { order: 65, no: 441, title: 'Arranging Coins', topic: 'Math, Binary Search', hints: [
    'Find k where 1+2+...+k <= n. Sum = k*(k+1)/2.',
    'Binary search: lo=0,hi=n; mid*(mid+1)/2<=n? lo=mid+1 : hi=mid-1.',
    'Math formula (quadratic): Math.floor((-1+Math.sqrt(1+8*n))/2)',
  ]},
  { order: 66, no: 448, title: 'Find All Numbers Disappeared in an Array', topic: 'Array', hints: [
    'Mark visited indices by negating values; collect indices still positive.',
    'for(const n of nums){const i=Math.abs(n)-1; if(nums[i]>0)nums[i]=-nums[i];}',
    'return nums.map((_,i)=>i+1).filter((_,i)=>nums[i]>0);',
  ]},
  { order: 67, no: 455, title: 'Assign Cookies', topic: 'Array, Greedy', hints: [
    'Sort both arrays. Try to satisfy smallest child with smallest sufficient cookie.',
    'g.sort((a,b)=>a-b); s.sort((a,b)=>a-b); let child=0,cookie=0;',
    'while(child<g.length&&cookie<s.length){if(s[cookie]>=g[child])child++; cookie++;} return child;',
  ]},
  { order: 68, no: 459, title: 'Repeated Substring Pattern', topic: 'String', hints: [
    'If s is built from a repeated pattern p, then (s+s) substring trick works.',
    'return (s+s).slice(1,-1).includes(s);',
    'Alt: try each prefix as pattern and check if it tiles the whole string.',
  ]},
  { order: 69, no: 482, title: 'License Key Formatting', topic: 'String', hints: [
    'Remove dashes, uppercase, then insert a dash every k chars from right.',
    'const raw=s.replace(/-/g,"").toUpperCase(); const firstLen=raw.length%k||k;',
    'const parts=[raw.slice(0,firstLen)]; for(let i=firstLen;i<raw.length;i+=k)parts.push(raw.slice(i,i+k)); return parts.join("-");',
  ]},
  { order: 70, no: 485, title: 'Max Consecutive Ones', topic: 'Array', hints: [
    'Track current consecutive count and max.',
    'let cur=0,max=0; for(const n of nums){n?cur++:cur=0; max=Math.max(max,cur);} return max;',
  ]},
  { order: 71, no: 492, title: 'Construct the Rectangle', topic: 'Math', hints: [
    'Find W closest to sqrt(area) such that area%W===0 and L>=W.',
    'let w=Math.floor(Math.sqrt(area)); while(area%w!==0)w--; return [area/w,w];',
  ]},
  { order: 72, no: 495, title: 'Teemo Attacking', topic: 'Array, Simulation', hints: [
    'For each attack, poisoned duration is min(duration, gap to next attack).',
    'let total=0; for(let i=0;i<timeSeries.length-1;i++)total+=Math.min(duration,timeSeries[i+1]-timeSeries[i]);',
    'return total+duration; // last attack always contributes full duration',
  ]},
  { order: 73, no: 496, title: 'Next Greater Element I', topic: 'Array, Stack, Monotonic Stack', hints: [
    'Use a monotonic decreasing stack on nums2 to precompute next greater for each element.',
    'const map=new Map(); const st=[];',
    'for(const n of nums2){while(st.length&&st[st.length-1]<n)map.set(st.pop(),n); st.push(n);}',
    'return nums1.map(n=>map.get(n)??-1);',
  ]},
  { order: 74, no: 500, title: 'Keyboard Row', topic: 'String, Hash Set', hints: [
    'Group keyboard rows into sets: row1="qwertyuiop", row2="asdfghjkl", row3="zxcvbnm".',
    'For each word, check if all lowercase chars belong to the same row set.',
    'const rows=["qwertyuiop","asdfghjkl","zxcvbnm"].map(r=>new Set(r));',
    'return words.filter(w=>rows.some(row=>[...w.toLowerCase()].every(c=>row.has(c))));',
  ]},
  { order: 75, no: 506, title: 'Relative Ranks', topic: 'Array, Sorting', hints: [
    'Map sorted-descending indices to ranks; special labels for top 3.',
    'const medals=["Gold Medal","Silver Medal","Bronze Medal"];',
    'const ranked=[...score].sort((a,b)=>b-a); const pos=new Map(ranked.map((v,i)=>[v,i]));',
    'return score.map(v=>pos.get(v)<3?medals[pos.get(v)]:String(pos.get(v)+1));',
  ]},
  { order: 76, no: 507, title: 'Perfect Number', topic: 'Math', hints: [
    'Sum all proper divisors (1 to sqrt(num)). Include both i and num/i (except sqrt).',
    'let sum=1; for(let i=2;i*i<=num;i++)if(num%i===0){sum+=i; if(i!==num/i)sum+=num/i;}',
    'return num>1&&sum===num;',
  ]},
  { order: 77, no: 509, title: 'Fibonacci Number', topic: 'Math, Dynamic Programming', hints: [
    'F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).',
    'Iterative O(n): let a=0,b=1; for(let i=0;i<n;i++){[a,b]=[b,a+b];} return a;',
  ]},
  { order: 78, no: 520, title: 'Detect Capital', topic: 'String', hints: [
    'Valid: all caps, all lowercase, or only first letter capitalized.',
    'return word===word.toUpperCase()||word===word.toLowerCase()||word[0]===word[0].toUpperCase()&&word.slice(1)===word.slice(1).toLowerCase();',
    'Or use regex: /^[A-Z]+$|^[a-z]+$|^[A-Z][a-z]*$/.test(word)',
  ]},
  { order: 79, no: 521, title: 'Longest Uncommon Subsequence I', topic: 'String', hints: [
    'If strings are equal, any common subsequence appears in both — LUS does not exist: return -1.',
    'If different, the longer string itself cannot be a subsequence of the shorter one — return max length.',
    'return a===b?-1:Math.max(a.length,b.length);',
  ]},
  { order: 80, no: 541, title: 'Reverse String II', topic: 'String, Two Pointers', hints: [
    'Process the string in chunks of 2k. Reverse the first k chars of each chunk.',
    'const a=[...s]; for(let i=0;i<a.length;i+=2*k){let l=i,r=Math.min(i+k-1,a.length-1); while(l<r){[a[l],a[r]]=[a[r],a[l]];l++;r--;}}',
    'return a.join("");',
  ]},
  { order: 81, no: 551, title: 'Student Attendance Record I', topic: 'String', hints: [
    'Absent if more than one "A". Late if three consecutive "L"s.',
    'return !/A.*A/.test(s)&&!s.includes("LLL");',
    'Or count As and check for "LLL" substring.',
  ]},
  { order: 82, no: 557, title: 'Reverse Words in a String III', topic: 'String, Two Pointers', hints: [
    'Split by space, reverse each word, rejoin.',
    'return s.split(" ").map(w=>w.split("").reverse().join("")).join(" ");',
    'Or: s.split(" ").map(w=>[...w].reverse().join("")).join(" ")',
  ]},
  { order: 83, no: 561, title: 'Array Partition', topic: 'Array, Sorting, Greedy', hints: [
    'Sort the array. Pair adjacent elements. Sum of first elements of each pair is maximized.',
    'nums.sort((a,b)=>a-b); return nums.reduce((s,v,i)=>i%2===0?s+v:s,0);',
  ]},
  { order: 84, no: 566, title: 'Reshape the Matrix', topic: 'Array, Matrix', hints: [
    'Flatten the matrix row by row, then fill into new r×c matrix.',
    'if(r*c!==mat.length*mat[0].length)return mat; const flat=mat.flat();',
    'return Array.from({length:r},(_,i)=>flat.slice(i*c,i*c+c));',
  ]},
  { order: 85, no: 575, title: 'Distribute Candies', topic: 'Array, Hash Set', hints: [
    'Max unique types a sister can have = min(uniqueTypes, n/2).',
    'return Math.min(new Set(candyType).size, candyType.length/2);',
  ]},
  { order: 86, no: 594, title: 'Longest Harmonious Subsequence', topic: 'Array, Hash Map', hints: [
    'A harmonious subsequence has max-min===1. Count frequencies.',
    'const freq=new Map(); for(const n of nums) freq.set(n,(freq.get(n)||0)+1);',
    'return Math.max(...[...freq.keys()].map(k=>freq.has(k+1)?freq.get(k)+freq.get(k+1):0));',
  ]},
  { order: 87, no: 599, title: 'Minimum Index Sum of Two Lists', topic: 'Array, Hash Map', hints: [
    'Map list1 values to their indices. Find common elements; track minimum index sum.',
    'const map=new Map(list1.map((v,i)=>[v,i])); let min=Infinity,res=[];',
    'for(let j=0;j<list2.length;j++){if(map.has(list2[j])){const s=map.get(list2[j])+j; if(s<min){min=s;res=[list2[j]];}else if(s===min)res.push(list2[j]);}} return res;',
  ]},
  { order: 88, no: 605, title: 'Can Place Flowers', topic: 'Array, Greedy', hints: [
    'Plant greedily at every valid empty spot (neighbors both 0 or boundary).',
    'for(let i=0;i<flowerbed.length;i++){if(flowerbed[i]===0&&(i===0||flowerbed[i-1]===0)&&(i===flowerbed.length-1||flowerbed[i+1]===0)){flowerbed[i]=1;n--;}}',
    'return n<=0;',
  ]},
  { order: 89, no: 628, title: 'Maximum Product of Three Numbers', topic: 'Array, Math, Sorting', hints: [
    'After sorting: either (top 3) or (bottom 2 negatives × top 1 positive).',
    'nums.sort((a,b)=>a-b); const n=nums.length;',
    'return Math.max(nums[0]*nums[1]*nums[n-1], nums[n-1]*nums[n-2]*nums[n-3]);',
  ]},
  { order: 90, no: 643, title: 'Maximum Average Subarray I', topic: 'Array, Sliding Window', hints: [
    'Sliding window of size k: add incoming element, subtract outgoing, track max sum.',
    'let sum=nums.slice(0,k).reduce((a,b)=>a+b,0),max=sum;',
    'for(let i=k;i<nums.length;i++){sum+=nums[i]-nums[i-k]; max=Math.max(max,sum);} return max/k;',
  ]},
  { order: 91, no: 645, title: 'Set Mismatch', topic: 'Array, Hash Map', hints: [
    'Count frequencies. The element with count 2 is duplicate; the one with count 0 is missing.',
    'const freq=new Array(nums.length+1).fill(0); for(const n of nums)freq[n]++;',
    'let dup,missing; for(let i=1;i<=nums.length;i++){if(freq[i]===2)dup=i; if(freq[i]===0)missing=i;} return [dup,missing];',
  ]},
  { order: 92, no: 657, title: 'Robot Return to Origin', topic: 'String', hints: [
    'Count U/D and L/R — both pairs must balance to zero.',
    'return moves.split("").reduce((p,c)=>{c==="U"?p[1]++:c==="D"?p[1]--:c==="L"?p[0]--:p[0]++;return p;},[0,0]).every(v=>v===0);',
  ]},
  { order: 93, no: 674, title: 'Longest Continuous Increasing Subsequence', topic: 'Array', hints: [
    'Track current run length; reset to 1 when not increasing.',
    'let cur=1,max=1; for(let i=1;i<nums.length;i++){nums[i]>nums[i-1]?cur++:cur=1; max=Math.max(max,cur);} return max;',
  ]},
  { order: 94, no: 680, title: 'Valid Palindrome II', topic: 'String, Two Pointers, Greedy', hints: [
    'Two pointers. When mismatch found, try skipping left char OR right char.',
    'const isPalin=(s,l,r)=>{while(l<r)if(s[l++]!==s[r--])return false; return true;};',
    'let l=0,r=s.length-1; while(l<r){if(s[l]!==s[r])return isPalin(s,l+1,r)||isPalin(s,l,r-1); l++;r--;} return true;',
  ]},
  { order: 95, no: 682, title: 'Baseball Game', topic: 'Array, Stack, Simulation', hints: [
    'Simulate with a stack. "+": sum top 2. "D": double top. "C": remove top. Else: push int.',
    'const st=[]; for(const op of operations){if(op==="+")st.push(st.at(-1)+st.at(-2)); else if(op==="D")st.push(st.at(-1)*2); else if(op==="C")st.pop(); else st.push(+op);}',
    'return st.reduce((a,b)=>a+b,0);',
  ]},
  { order: 96, no: 696, title: 'Count Binary Substrings', topic: 'String, Two Pointers', hints: [
    'Track consecutive groups: count adjacent runs of same character.',
    'let prev=0,cur=1,res=0; for(let i=1;i<s.length;i++){s[i]===s[i-1]?cur++:(prev=cur,cur=1); if(prev>=cur)res++;}',
    'return res;',
  ]},
  { order: 97, no: 697, title: 'Degree of an Array', topic: 'Array, Hash Map', hints: [
    'Degree = max frequency. Find all elements with max freq, return smallest subarray containing each.',
    'Track first and last index + frequency for each element.',
    'const first={},last={},cnt={}; for(let i=0;i<nums.length;i++){const n=nums[i]; first[n]??=i; last[n]=i; cnt[n]=(cnt[n]||0)+1;}',
    'const deg=Math.max(...Object.values(cnt)); return Math.min(...Object.keys(cnt).filter(k=>cnt[k]===deg).map(k=>last[k]-first[k]+1));',
  ]},
  { order: 98, no: 709, title: 'To Lower Case', topic: 'String', hints: [
    'return s.toLowerCase(); // one-liner in JS',
    'Manual: [...s].map(c=>c>="A"&&c<="Z"?String.fromCharCode(c.charCodeAt(0)+32):c).join("")',
  ]},
  { order: 99, no: 717, title: '1-bit and 2-bit Characters', topic: 'Array', hints: [
    'Scan from left: if bit is 1, skip next (it is a 2-bit char). If 0, it is 1-bit char.',
    'let i=0; while(i<bits.length-1){i+=bits[i]?2:1;} return bits[i]===0;',
    'At the end i should be at the last index for it to be a 1-bit char.',
  ]},
  { order: 100, no: 724, title: 'Find Pivot Index', topic: 'Array, Prefix Sum', hints: [
    'Pivot: leftSum === rightSum. Total sum - nums[i] - leftSum === leftSum.',
    'let total=nums.reduce((a,b)=>a+b,0),left=0;',
    'for(let i=0;i<nums.length;i++){if(left===(total-nums[i]-left))return i; left+=nums[i];} return -1;',
  ]},
  { order: 101, no: 728, title: 'Self Dividing Numbers', topic: 'Array, Math', hints: [
    'A number is self-dividing if divisible by each of its non-zero digits.',
    'const isSelf=n=>[...String(n)].every(d=>d!=="0"&&n%+d===0);',
    'return Array.from({length:right-left+1},(_,i)=>i+left).filter(isSelf);',
  ]},
  { order: 102, no: 796, title: 'Rotate String', topic: 'String', hints: [
    'If s is a rotation of goal, it appears in goal+goal.',
    'return s.length===goal.length&&(goal+goal).includes(s);',
  ]},
  { order: 103, no: 804, title: 'Unique Morse Code Words', topic: 'Array, String, Hash Set', hints: [
    'Map each char to its Morse code, transform each word, put in Set.',
    'const morse=[".-","-...","-.-.","-..",".","..-.","--.","....","..",".---","-.-",".-..","--","-.","---",".--.","--.-",".-.","...","-","..-","...-",".--","-..-","-.--","--.."];',
    'return new Set(words.map(w=>[...w].map(c=>morse[c.charCodeAt(0)-97]).join(""))).size;',
  ]},
  { order: 104, no: 806, title: 'Number of Lines To Write The String', topic: 'Array, String', hints: [
    'Simulate writing: accumulate widths, start a new line when exceeding 100.',
    'let lines=1,cur=0; for(const c of s){const w=widths[c.charCodeAt(0)-97]; if(cur+w>100){lines++;cur=0;} cur+=w;}',
    'return [lines,cur];',
  ]},
  { order: 105, no: 819, title: 'Most Common Word', topic: 'String, Hash Map', hints: [
    'Normalize: lowercase, split by non-alpha, filter banned words, find max frequency.',
    'const ban=new Set(banned); const words=paragraph.toLowerCase().split(/[^a-z]+/).filter(Boolean);',
    'const freq={}; for(const w of words) if(!ban.has(w)) freq[w]=(freq[w]||0)+1;',
    'return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0];',
  ]},
  { order: 106, no: 821, title: 'Shortest Distance to a Character', topic: 'Array, Two Pointers', hints: [
    'Two passes: left-to-right tracking last seen position of c; right-to-left same.',
    'const res=new Array(s.length).fill(Infinity); let prev=-Infinity;',
    'for(let i=0;i<s.length;i++){if(s[i]===c)prev=i; res[i]=i-prev;}',
    'prev=Infinity; for(let i=s.length-1;i>=0;i--){if(s[i]===c)prev=i; res[i]=Math.min(res[i],prev-i);} return res;',
  ]},
  { order: 107, no: 824, title: 'Goat Latin', topic: 'String', hints: [
    'Vowel-start: append "ma" + "a"*(i+1). Consonant-start: move first char to end, append "ma" + "a"*(i+1).',
    'const vowels=new Set("aeiouAEIOU"); return sentence.split(" ").map((w,i)=>{const suffix="ma"+"a".repeat(i+1); return vowels.has(w[0])?w+suffix:w.slice(1)+w[0]+suffix;}).join(" ");',
  ]},
  { order: 108, no: 830, title: 'Positions of Large Groups', topic: 'String', hints: [
    'Track start of each group. When group ends (char changes or end), record if length>=3.',
    'const res=[]; let start=0;',
    'for(let i=1;i<=s.length;i++){if(i===s.length||s[i]!==s[start]){if(i-start>=3)res.push([start,i-1]); start=i;}} return res;',
  ]},
  { order: 109, no: 832, title: 'Flipping an Image', topic: 'Array, Two Pointers', hints: [
    'For each row: reverse, then XOR every bit with 1 (0→1, 1→0).',
    'image.map(row=>[...row].reverse().map(b=>b^1))',
    'Combined with two-pointer swap + XOR: avoids creating reversed array first.',
  ]},
  { order: 110, no: 836, title: 'Rectangle Overlap', topic: 'Math, Geometry', hints: [
    'Two rectangles overlap if they overlap in BOTH x and y axes.',
    'No overlap in x: rec1[2]<=rec2[0]||rec2[2]<=rec1[0]. Same for y.',
    'return !(rec1[2]<=rec2[0]||rec1[0]>=rec2[2]||rec1[3]<=rec2[1]||rec1[1]>=rec2[3]);',
  ]},
  { order: 111, no: 844, title: 'Backspace String Compare', topic: 'String, Two Pointers, Stack', hints: [
    'Process each string: push chars, pop on "#".',
    'const process=s=>{const st=[]; for(const c of s)c==="#"?st.pop():st.push(c); return st.join("");};',
    'return process(s)===process(t);',
  ]},
  { order: 112, no: 859, title: 'Buddy Strings', topic: 'String, Hash Set', hints: [
    'Two cases: (1) exact same string with a repeated char (can swap repeated chars); (2) exactly 2 positions differ and swapping fixes both.',
    'if(s.length!==t.length)return false; if(s===t)return new Set(s).size<s.length;',
    'const diff=[...s].map((c,i)=>[c,t[i]]).filter(([a,b])=>a!==b); return diff.length===2&&diff[0][0]===diff[1][1]&&diff[0][1]===diff[1][0];',
  ]},
  { order: 113, no: 860, title: 'Lemonade Change', topic: 'Array, Greedy', hints: [
    'Keep count of $5 and $10 bills. Give change greedily (prefer $10 for $20 change).',
    'let five=0,ten=0; for(const bill of bills){if(bill===5)five++; else if(bill===10){if(!five--)return false; ten++;} else{if(ten&&five){ten--;five--;} else if(five>=3)five-=3; else return false;}}',
    'return true;',
  ]},
  { order: 114, no: 867, title: 'Transpose Matrix', topic: 'Array, Matrix', hints: [
    'Swap rows and columns: result[j][i] = matrix[i][j].',
    'return matrix[0].map((_,j)=>matrix.map(row=>row[j]));',
  ]},
  { order: 115, no: 884, title: 'Uncommon Words from Two Sentences', topic: 'String, Hash Map', hints: [
    'A word is uncommon if it appears exactly once across both sentences.',
    'const freq={}; for(const w of [...s1.split(" "),...s2.split(" ")]) freq[w]=(freq[w]||0)+1;',
    'return Object.keys(freq).filter(k=>freq[k]===1);',
  ]},
  { order: 116, no: 888, title: 'Fair Candy Swap', topic: 'Array, Hash Set, Math', hints: [
    'Sum Alice - Sum Bob = 2*(a - b) where a from Alice, b from Bob.',
    'const diff=(aliceSizes.reduce((a,b)=>a+b,0)-bobSizes.reduce((a,b)=>a+b,0))/2;',
    'const bobSet=new Set(bobSizes); for(const a of aliceSizes){if(bobSet.has(a-diff))return [a,a-diff];}',
  ]},
  { order: 117, no: 892, title: 'Surface Area of 3D Shapes', topic: 'Array, Math, Geometry', hints: [
    'Each cube contributes 6 faces. Subtract 2 for each adjacent cube pair (vertical stacking and neighbors).',
    'let area=0; for(let i=0;i<grid.length;i++)for(let j=0;j<grid[0].length;j++){if(grid[i][j]){area+=grid[i][j]*4+2;',
    'if(i>0)area-=Math.min(grid[i][j],grid[i-1][j])*2; if(j>0)area-=Math.min(grid[i][j],grid[i][j-1])*2;}}',
    'return area;',
  ]},
  { order: 118, no: 896, title: 'Monotonic Array', topic: 'Array', hints: [
    'Check if the array is entirely non-decreasing OR entirely non-increasing.',
    'let inc=true,dec=true; for(let i=1;i<nums.length;i++){if(nums[i]>nums[i-1])dec=false; if(nums[i]<nums[i-1])inc=false;}',
    'return inc||dec;',
  ]},
  { order: 119, no: 905, title: 'Sort Array By Parity', topic: 'Array, Two Pointers', hints: [
    'Two pointers: move evens to front. Swap when left is odd and right is even.',
    'let l=0,r=nums.length-1; while(l<r){while(l<r&&nums[l]%2===0)l++; while(l<r&&nums[r]%2)r--; if(l<r)[nums[l],nums[r]]=[nums[r],nums[l]];}',
    'return nums;',
  ]},
  { order: 120, no: 908, title: 'Smallest Range I', topic: 'Array, Math', hints: [
    'The best we can do: raise the min by k, lower the max by k. If they still differ, that is the answer.',
    'return Math.max(0, Math.max(...nums)-Math.min(...nums)-2*k);',
  ]},
  { order: 121, no: 917, title: 'Reverse Only Letters', topic: 'String, Two Pointers', hints: [
    'Two pointers, skip non-letters, swap letters.',
    'const a=[...s]; let l=0,r=a.length-1; const isLetter=c=>/[a-zA-Z]/.test(c);',
    'while(l<r){while(l<r&&!isLetter(a[l]))l++; while(l<r&&!isLetter(a[r]))r--; [a[l],a[r]]=[a[r],a[l]]; l++;r--;} return a.join("");',
  ]},
  { order: 122, no: 922, title: 'Sort Array By Parity II', topic: 'Array, Two Pointers', hints: [
    'Even indices get even numbers, odd indices get odd numbers.',
    'Two pointers: i for even index needing odd value, j for odd index needing even value; swap when both mismatch.',
    'let j=1; for(let i=0;i<nums.length;i+=2){if(nums[i]%2){while(nums[j]%2)j+=2; [nums[i],nums[j]]=[nums[j],nums[i]];}} return nums;',
  ]},
  { order: 123, no: 925, title: 'Long Pressed Name', topic: 'String, Two Pointers', hints: [
    'Two pointers on name (i) and typed (j). Advance i when match; always advance j.',
    'let i=0; for(const c of typed){if(i<name.length&&c===name[i])i++; else if(j===0||c!==typed[j-1])return false;}',
    'return i===name.length; // must have consumed all of name',
    'let i=0; for(let j=0;j<typed.length;j++){if(i<name.length&&typed[j]===name[i])i++; else if(j===0||typed[j]!==typed[j-1])return false;} return i===name.length;',
  ]},
  { order: 124, no: 929, title: 'Unique Email Addresses', topic: 'Array, String, Hash Set', hints: [
    'Local part: remove dots, ignore everything after "+". Domain: unchanged.',
    'const normalize=e=>{const [l,d]=e.split("@"); return l.split("+")[0].replace(/\\./g,"")+`@${d}`;};',
    'return new Set(emails.map(normalize)).size;',
  ]},
  { order: 125, no: 933, title: 'Number of Recent Calls', topic: 'Queue, Design', hints: [
    'Use a queue. On each ping, enqueue t, dequeue all < t-3000.',
    'class RecentCounter{constructor(){this.q=[];} ping(t){this.q.push(t); while(this.q[0]<t-3000)this.q.shift(); return this.q.length;}}',
  ]},
  { order: 126, no: 941, title: 'Valid Mountain Array', topic: 'Array', hints: [
    'Peak must not be first or last element. Must strictly increase then strictly decrease.',
    'let i=0; while(i<arr.length-1&&arr[i]<arr[i+1])i++; if(i===0||i===arr.length-1)return false;',
    'while(i<arr.length-1&&arr[i]>arr[i+1])i++; return i===arr.length-1;',
  ]},
  { order: 127, no: 942, title: 'DI String Match', topic: 'Array, String, Greedy, Two Pointers', hints: [
    'Use a range [lo, hi]. "I" gets lo (smallest available), "D" gets hi (largest available).',
    'let lo=0,hi=s.length; const res=[];',
    'for(const c of s) res.push(c==="I"?lo++:hi--); res.push(lo); return res;',
  ]},
  { order: 128, no: 944, title: 'Delete Columns to Make Sorted', topic: 'Array, String', hints: [
    'Check each column: if any row has char < row above, that column must be deleted.',
    'let count=0; for(let j=0;j<strs[0].length;j++) for(let i=1;i<strs.length;i++) if(strs[i][j]<strs[i-1][j]){count++; break;}',
    'return count;',
  ]},
  { order: 129, no: 953, title: 'Verifying an Alien Dictionary', topic: 'Array, String, Hash Map', hints: [
    'Build a rank map from order string. Compare adjacent words using these ranks.',
    'const rank={}; for(let i=0;i<order.length;i++) rank[order[i]]=i;',
    'For each pair of adjacent words: find first differing char. If rank[a]>rank[b] return false. If a is prefix of longer b, also false.',
  ]},
  { order: 130, no: 961, title: 'N-Repeated Element in Size 2N Array', topic: 'Array, Hash Map', hints: [
    'The repeated element appears n times in a 2n array — use a Set.',
    'const seen=new Set(); for(const n of nums){if(seen.has(n))return n; seen.add(n);}',
    'Or check if nums[i]===nums[i-1] or nums[i]===nums[i-2] (pigeonhole: must appear within 3 consecutive).',
  ]},
  { order: 131, no: 976, title: 'Largest Perimeter Triangle', topic: 'Array, Sorting, Greedy', hints: [
    'Sort descending. For triangle: two shorter sides must sum > longest. First valid triple is the answer.',
    'nums.sort((a,b)=>b-a);',
    'for(let i=0;i<nums.length-2;i++) if(nums[i]<nums[i+1]+nums[i+2]) return nums[i]+nums[i+1]+nums[i+2];',
    'return 0;',
  ]},
  { order: 132, no: 977, title: 'Squares of a Sorted Array', topic: 'Array, Two Pointers, Sorting', hints: [
    'Sorted array may have negatives. Largest squares are at the two ends.',
    'Two pointers from both ends; fill result from right.',
    'const res=new Array(nums.length); let l=0,r=nums.length-1,i=r;',
    'while(l<=r){const ls=nums[l]*nums[l],rs=nums[r]*nums[r]; res[i--]=ls>rs?(l++,ls):(r--,rs);} return res;',
  ]},
  { order: 133, no: 989, title: 'Add to Array-Form of Integer', topic: 'Array, Math', hints: [
    'Add k to the last element of num, propagate carry from right to left.',
    'for(let i=num.length-1;i>=0&&k;i--){k+=num[i]; num[i]=k%10; k=k/10|0;}',
    'while(k){num.unshift(k%10); k=k/10|0;} return num;',
  ]},
  { order: 134, no: 1002, title: 'Find Common Characters', topic: 'Array, String, Hash Map', hints: [
    'Minimum frequency of each char across all words = chars that appear in all words.',
    'Start with freq of words[0]. For each subsequent word, take element-wise min.',
    'const minFreq=Array(26).fill(Infinity); for(const w of words){const f=Array(26).fill(0); for(const c of w)f[c.charCodeAt(0)-97]++; for(let i=0;i<26;i++)minFreq[i]=Math.min(minFreq[i],f[i]);}',
    'return minFreq.flatMap((cnt,i)=>Array(cnt).fill(String.fromCharCode(97+i)));',
  ]},
  { order: 135, no: 1005, title: 'Maximize Sum Of Array After K Negations', topic: 'Array, Greedy, Sorting', hints: [
    'Sort. Negate negatives from smallest (largest magnitude) first.',
    'nums.sort((a,b)=>a-b); for(let i=0;i<k;i++){if(nums[i]<0)nums[i]=-nums[i]; else{nums.sort((a,b)=>a-b); nums[0]=-nums[0]; break;}}',
    'Actually easier: sort by absolute value desc, negate each negative; if k remains odd, negate the smallest absolute value.',
  ]},
  { order: 136, no: 1013, title: 'Partition Array Into Three Parts With Equal Sum', topic: 'Array, Greedy', hints: [
    'Total must be divisible by 3. Find two partition points where prefix sums hit target and 2*target.',
    'const total=arr.reduce((a,b)=>a+b,0); if(total%3)return false; const third=total/3;',
    'let sum=0,count=0; for(const n of arr){sum+=n; if(sum===third*count+third)count++;} return count>=3;',
  ]},
  { order: 137, no: 1021, title: 'Remove Outermost Parentheses', topic: 'String, Stack', hints: [
    'Track depth. Opening at depth 0 is "outer" open — skip. Closing that brings to 0 is "outer" close — skip.',
    'let depth=0,res=""; for(const c of s){if(c==="("&&depth++>0)res+=c; if(c===")"&&--depth>0)res+=c;}',
    'return res;',
  ]},
  { order: 138, no: 1025, title: 'Divisor Game', topic: 'Math, Dynamic Programming', hints: [
    'Alice wins if and only if n is even.',
    'Proof: even→take 1→give odd to Bob→Bob forced to take odd divisor→gives even back to Alice.',
    'return n%2===0;',
  ]},
  { order: 139, no: 1047, title: 'Remove All Adjacent Duplicates In String', topic: 'String, Stack', hints: [
    'Use a stack. If top matches current char, pop (remove pair). Else push.',
    'const st=[]; for(const c of s){if(st.at(-1)===c)st.pop(); else st.push(c);}',
    'return st.join("");',
  ]},
  { order: 140, no: 1051, title: 'Height Checker', topic: 'Array, Sorting', hints: [
    'Compare each position with the sorted (expected) array.',
    'const expected=[...heights].sort((a,b)=>a-b); return heights.filter((h,i)=>h!==expected[i]).length;',
  ]},
  { order: 141, no: 1071, title: 'Greatest Common Divisor of Strings', topic: 'Math, String', hints: [
    'If str1 and str2 have a common divisor, str1+str2 must equal str2+str1.',
    'The GCD string has length gcd(str1.length, str2.length).',
    'if(str1+str2!==str2+str1)return ""; const gcd=(a,b)=>b?gcd(b,a%b):a; return str1.slice(0,gcd(str1.length,str2.length));',
  ]},
  { order: 142, no: 1078, title: 'Occurrences After Bigram', topic: 'String', hints: [
    'Split by space. Find indices where words[i]===first && words[i+1]===second, collect words[i+2].',
    'const w=text.split(" "); return w.filter((_,i)=>i>=2&&w[i-2]===first&&w[i-1]===second);',
  ]},
  { order: 143, no: 1089, title: 'Duplicate Zeros', topic: 'Array', hints: [
    'When you encounter a 0, duplicate it — shift everything after right by 1, dropping the last.',
    'In-place: for(let i=0;i<arr.length;i++){if(arr[i]===0){arr.splice(i,0,0); arr.pop(); i++;}}',
    'More efficient: two-pass — count zeros, place from end.',
  ]},
  { order: 144, no: 1103, title: 'Distribute Candies to People', topic: 'Array, Math', hints: [
    'Simulate: give 1,2,3,...candies in order, wrap around.',
    'const res=new Array(n).fill(0); let i=0,give=1;',
    'while(candies>0){res[i%n]+=Math.min(give,candies); candies-=give; give++; i++;} return res;',
  ]},
  { order: 145, no: 1122, title: 'Relative Sort Array', topic: 'Array, Sorting, Hash Map', hints: [
    'Elements in arr2 first (in arr2 order), then remaining elements sorted ascending.',
    'const pos=new Map(arr2.map((v,i)=>[v,i]));',
    'return arr1.sort((a,b)=>pos.has(a)&&pos.has(b)?pos.get(a)-pos.get(b):pos.has(a)?-1:pos.has(b)?1:a-b);',
  ]},
  { order: 146, no: 1128, title: 'Number of Equivalent Domino Pairs', topic: 'Array, Hash Map, Counting', hints: [
    'Normalize each domino: [min,max]. Use a key string. Count pairs using frequency.',
    'const freq={}; let count=0;',
    'for(const [a,b] of dominoes){const key=Math.min(a,b)+","+Math.max(a,b); count+=(freq[key]||0); freq[key]=(freq[key]||0)+1;}',
    'return count;',
  ]},
  { order: 147, no: 1137, title: 'N-th Tribonacci Number', topic: 'Dynamic Programming, Math', hints: [
    'T(0)=0, T(1)=1, T(2)=1, T(n)=T(n-1)+T(n-2)+T(n-3).',
    'let [a,b,c]=[0,1,1]; for(let i=3;i<=n;i++){[a,b,c]=[b,c,a+b+c];}',
    'return n===0?0:n<=2?1:c;',
  ]},
  { order: 148, no: 1154, title: 'Day of the Year', topic: 'Math, String', hints: [
    'Parse year/month/day. Sum days in preceding months. Account for leap year in Feb.',
    'const isLeap=y=>y%4===0&&(y%100!==0||y%400===0); const [y,m,d]=date.split("-").map(Number);',
    'const days=[31,isLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31]; return days.slice(0,m-1).reduce((a,b)=>a+b,0)+d;',
  ]},
  { order: 149, no: 1160, title: 'Find Words That Can Be Formed by Characters', topic: 'Array, String, Hash Map', hints: [
    'Count char frequency in chars. For each word, check it can be formed from those counts.',
    'const charFreq={}; for(const c of chars) charFreq[c]=(charFreq[c]||0)+1;',
    'const canForm=w=>{const wf={}; for(const c of w)wf[c]=(wf[c]||0)+1; return Object.entries(wf).every(([c,cnt])=>(charFreq[c]||0)>=cnt);};',
    'return words.filter(canForm).reduce((s,w)=>s+w.length,0);',
  ]},
  { order: 150, no: 1184, title: 'Distance Between Bus Stops', topic: 'Array, Math', hints: [
    'Two routes: clockwise (sum start to destination) and counter-clockwise (total - clockwise).',
    'const total=distance.reduce((a,b)=>a+b,0); let clockwise=0;',
    'let i=start; while(i!==destination){clockwise+=distance[i]; i=(i+1)%distance.length;}',
    'return Math.min(clockwise,total-clockwise);',
  ]},
  { order: 151, no: 1185, title: 'Day of the Week', topic: 'Math', hints: [
    'Use JS Date: new Date(year,month-1,day).getDay() returns 0=Sun..6=Sat.',
    'const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];',
    'return days[new Date(year,month-1,day).getDay()];',
  ]},
  { order: 152, no: 1189, title: 'Maximum Number of Balloons', topic: 'String, Hash Map, Counting', hints: [
    '"balloon" needs b×1, a×1, l×2, o×2, n×1. Divide each count by the required frequency.',
    'const freq={}; for(const c of text) freq[c]=(freq[c]||0)+1;',
    'return Math.floor(Math.min(freq.b||0, freq.a||0, (freq.l||0)/2, (freq.o||0)/2, freq.n||0));',
  ]},
  { order: 153, no: 1200, title: 'Minimum Absolute Difference', topic: 'Array, Sorting', hints: [
    'Sort the array. Minimum difference is between adjacent elements.',
    'arr.sort((a,b)=>a-b); const minDiff=Math.min(...arr.slice(1).map((v,i)=>v-arr[i]));',
    'return arr.slice(1).reduce((res,v,i)=>{const d=v-arr[i]; if(d<res.minD)return{minD:d,pairs:[[arr[i],v]]}; if(d===res.minD)res.pairs.push([arr[i],v]); return res;},{minD:Infinity,pairs:[]}).pairs;',
  ]},
  { order: 154, no: 1207, title: 'Unique Number of Occurrences', topic: 'Array, Hash Map', hints: [
    'Count frequencies; check if the frequency values are all unique.',
    'const freq={}; for(const n of arr) freq[n]=(freq[n]||0)+1;',
    'const vals=Object.values(freq); return new Set(vals).size===vals.length;',
  ]},
  { order: 155, no: 1217, title: 'Minimum Cost to Move Chips to The Same Position', topic: 'Array, Math, Greedy', hints: [
    'Moving 2 steps costs 0. Moving 1 step costs 1. So odd-position chips can reach any odd pos free, even-pos free.',
    'Count chips on odd and even positions. Cost to move all to one side = min(oddCount, evenCount).',
    'const odd=position.filter(p=>p%2).length; return Math.min(odd,position.length-odd);',
  ]},
  { order: 156, no: 1221, title: 'Split a String in Balanced Strings', topic: 'String, Greedy, Counting', hints: [
    'Count R and L; every time they balance (count reaches 0), that is a valid split.',
    'let balance=0,count=0; for(const c of s){c==="R"?balance++:balance--; if(balance===0)count++;}',
    'return count;',
  ]},
  { order: 157, no: 1232, title: 'Check If It Is a Straight Line', topic: 'Array, Math, Geometry', hints: [
    'A straight line has consistent slope between all consecutive pairs.',
    'const [dx,dy]=[coordinates[1][0]-coordinates[0][0],coordinates[1][1]-coordinates[0][1]];',
    'return coordinates.every(([x,y])=>(x-coordinates[0][0])*dy===(y-coordinates[0][1])*dx);',
  ]},
  { order: 158, no: 1252, title: 'Cells with Odd Values in a Matrix', topic: 'Array, Math', hints: [
    'Track how many times each row and column is incremented.',
    'const rows=new Array(m).fill(0),cols=new Array(n).fill(0); for(const [r,c] of indices){rows[r]++;cols[c]++;}',
    'return rows.reduce((cnt,r)=>cnt+cols.reduce((c2,c)=>c2+((r+c)%2?1:0),0),0);',
  ]},
  { order: 159, no: 1266, title: 'Minimum Time Visiting All Points', topic: 'Array, Math', hints: [
    'Moving diagonally costs 1 — Chebyshev distance between consecutive points.',
    'return points.slice(1).reduce((sum,[x2,y2],i)=>sum+Math.max(Math.abs(x2-points[i][0]),Math.abs(y2-points[i][1])),0);',
  ]},
  { order: 160, no: 1281, title: 'Subtract the Product and Sum of Digits of an Integer', topic: 'Math', hints: [
    'Extract each digit, compute product and sum separately.',
    'const digits=[...String(n)].map(Number); return digits.reduce((a,b)=>a*b,1)-digits.reduce((a,b)=>a+b,0);',
  ]},
  { order: 161, no: 1287, title: 'Element Appearing More Than 25% In Sorted Array', topic: 'Array', hints: [
    'In a sorted array, the element > 25% must be at index n/4, n/2, or 3n/4.',
    'const n=arr.length; for(const i of [n>>2,n>>1,(3*n)>>2]) if(arr[i]===arr[i+n/4|0])return arr[i];',
    'Or: check if arr[i]===arr[i+n/4] for the candidate quarter-point positions.',
  ]},
  { order: 162, no: 1299, title: 'Replace Elements with Greatest Element on Right Side', topic: 'Array', hints: [
    'Scan right to left, tracking maximum seen so far.',
    'let maxRight=-1; for(let i=arr.length-1;i>=0;i--){const cur=arr[i]; arr[i]=maxRight; maxRight=Math.max(maxRight,cur);}',
    'return arr;',
  ]},
  { order: 163, no: 1304, title: 'Find N Unique Integers Sum up to Zero', topic: 'Array, Math', hints: [
    'Output 1,2,...,n-1 and then -(1+2+...+(n-1)) as the last element.',
    'const res=Array.from({length:n-1},(_,i)=>i+1); res.push(-res.reduce((a,b)=>a+b,0)); return res;',
  ]},
  { order: 164, no: 1309, title: 'Decrypt String from Alphabet to Integer Mapping', topic: 'String', hints: [
    'Process right to left: if char before "#" is at 3-char distance, take two-digit number; else single digit.',
    'let res="",i=s.length-1;',
    'while(i>=0){if(s[i]==="#"){res=String.fromCharCode(96+ +s.slice(i-2,i))+res; i-=3;}else{res=String.fromCharCode(96+ +s[i])+res; i--;}}',
    'return res;',
  ]},
  { order: 165, no: 1313, title: 'Decompress Run-Length Encoded List', topic: 'Array', hints: [
    'Pairs (freq, val): push val freq times.',
    'const res=[]; for(let i=0;i<list.length;i+=2) for(let j=0;j<list[i];j++) res.push(list[i+1]);',
    'return res;',
  ]},
  { order: 166, no: 1317, title: 'Convert Integer to the Sum of Two No-Zero Integers', topic: 'Math', hints: [
    'Try a=1,2,3,...; b=n-a. Return when neither a nor b contains digit 0.',
    'const hasZero=n=>String(n).includes("0");',
    'for(let a=1;a<n;a++){const b=n-a; if(!hasZero(a)&&!hasZero(b))return [a,b];}',
  ]},
  { order: 167, no: 1331, title: 'Rank Transform of an Array', topic: 'Array, Sorting, Hash Map', hints: [
    'Sort unique values, assign rank 1,2,3,... Map original values to their ranks.',
    'const sorted=[...new Set(arr)].sort((a,b)=>a-b); const rank=new Map(sorted.map((v,i)=>[v,i+1]));',
    'return arr.map(v=>rank.get(v));',
  ]},
  { order: 168, no: 1332, title: 'Remove Palindromic Subsequences', topic: 'String', hints: [
    'String has only "a" and "b". A palindromic subsequence of one letter removes all of that letter.',
    'If s is already a palindrome: 1 move. Else: always 2 moves (remove all "a"s then all "b"s).',
    'const isPalin=s===s.split("").reverse().join(""); return s.length===0?0:isPalin?1:2;',
  ]},
  { order: 169, no: 1337, title: 'The K Weakest Rows in a Matrix', topic: 'Array, Sorting, Matrix', hints: [
    'Count soldiers (1s) in each row. Sort rows by soldier count then by index.',
    'const strength=mat.map((row,i)=>[row.reduce((a,b)=>a+b,0),i]);',
    'strength.sort((a,b)=>a[0]-b[0]||a[1]-b[1]); return strength.slice(0,k).map(r=>r[1]);',
  ]},
  { order: 170, no: 1346, title: 'Check If N and Its Double Exist', topic: 'Array, Hash Set', hints: [
    'For each element, check if its double (or half if even) already exists.',
    'const seen=new Set(); for(const n of arr){if(seen.has(2*n)||n%2===0&&seen.has(n/2))return true; seen.add(n);}',
    'return false;',
  ]},
  { order: 171, no: 1351, title: 'Count Negative Numbers in a Sorted Matrix', topic: 'Array, Binary Search, Matrix', hints: [
    'Each row is sorted. Use binary search per row, or exploit the sorted grid.',
    'Simple: grid.flat().filter(n=>n<0).length',
    'Efficient: start top-right. Move left if negative (count remaining column), else move down.',
  ]},
  { order: 172, no: 1360, title: 'Number of Days Between Two Dates', topic: 'Math', hints: [
    'Use JS Date subtraction: dates are parsed via new Date(date).',
    'return Math.abs(new Date(date1)-new Date(date2))/(1000*60*60*24);',
  ]},
  { order: 173, no: 1370, title: 'Increasing Decreasing String', topic: 'String, Sorting, Hash Map', hints: [
    'Count frequencies. Repeatedly: pick smallest available chars ascending, then largest descending.',
    'const freq=Array(26).fill(0); for(const c of s) freq[c.charCodeAt(0)-97]++;',
    'let res=""; while(res.length<s.length){for(let i=0;i<26;i++)if(freq[i])res+=String.fromCharCode(97+i),freq[i]--; for(let i=25;i>=0;i--)if(freq[i])res+=String.fromCharCode(97+i),freq[i]--;}',
    'return res;',
  ]},
  { order: 174, no: 1374, title: 'Generate a String With Characters That Have Odd Counts', topic: 'String, Math', hints: [
    'If n is odd: "a".repeat(n). If n is even: "a".repeat(n-1)+"b".',
    'return n%2?"a".repeat(n):"a".repeat(n-1)+"b";',
  ]},
  { order: 175, no: 1380, title: 'Lucky Numbers in a Matrix', topic: 'Array, Matrix', hints: [
    'A lucky number is the minimum of its row AND the maximum of its column.',
    'const rowMin=matrix.map(row=>Math.min(...row)); const colMax=matrix[0].map((_,j)=>Math.max(...matrix.map(r=>r[j])));',
    'return matrix.flat().filter((v,idx)=>{const i=idx/matrix[0].length|0,j=idx%matrix[0].length; return v===rowMin[i]&&v===colMax[j];});',
  ]},
  { order: 176, no: 1385, title: 'Find the Distance Value Between Two Arrays', topic: 'Array, Sorting, Binary Search', hints: [
    'Count elements in arr1 where no element in arr2 is within distance d.',
    'Simple O(n*m): arr1.filter(a=>arr2.every(b=>Math.abs(a-b)>d)).length',
    'Better: sort arr2, binary search for range [a-d, a+d], check if empty.',
  ]},
  { order: 177, no: 1394, title: 'Find Lucky Integer in an Array', topic: 'Array, Hash Map', hints: [
    'Count frequencies. Find elements where freq[x]===x.',
    'const freq={}; for(const n of arr) freq[n]=(freq[n]||0)+1;',
    'return Math.max(-1,...Object.entries(freq).filter(([k,v])=>+k===v).map(([k])=>+k));',
  ]},
  { order: 178, no: 1399, title: 'Count Largest Group', topic: 'Hash Map, Math', hints: [
    'Group numbers 1..n by their digit sum. Count how many groups have the maximum size.',
    'const freq={}; for(let i=1;i<=n;i++){const k=[...String(i)].reduce((a,b)=>a+ +b,0); freq[k]=(freq[k]||0)+1;}',
    'const max=Math.max(...Object.values(freq)); return Object.values(freq).filter(v=>v===max).length;',
  ]},
  { order: 179, no: 1403, title: 'Minimum Subsequence in Non-Increasing Order', topic: 'Array, Greedy, Sorting', hints: [
    'Sort descending. Greedily pick elements until the selected sum > remaining sum.',
    'nums.sort((a,b)=>b-a); const total=nums.reduce((a,b)=>a+b,0); let sum=0,res=[];',
    'for(const n of nums){sum+=n; res.push(n); if(sum>total-sum)break;} return res;',
  ]},
  { order: 180, no: 1408, title: 'String Matching in an Array', topic: 'Array, String', hints: [
    'A word is a substring of another if words.some(other=>other!==word&&other.includes(word)).',
    'return words.filter(w=>words.some(other=>other!==w&&other.includes(w)));',
  ]},
  { order: 181, no: 1413, title: 'Minimum Value to Get Positive Step by Step Sum', topic: 'Array, Prefix Sum', hints: [
    'Find the minimum prefix sum. The starting value must offset it to at least 1.',
    'let sum=0,minSum=0; for(const n of nums){sum+=n; minSum=Math.min(minSum,sum);}',
    'return Math.max(1,1-minSum);',
  ]},
  { order: 182, no: 1417, title: 'Reformat The String', topic: 'String', hints: [
    'Separate digits and letters. Alternate them; longer group goes first.',
    'const digits=[...s].filter(c=>/\\d/.test(c)),letters=[...s].filter(c=>/[a-z]/.test(c));',
    'if(Math.abs(digits.length-letters.length)>1)return ""; let [a,b]=digits.length>=letters.length?[digits,letters]:[letters,digits];',
    'return a.map((c,i)=>c+(b[i]||"")).join("");',
  ]},
  { order: 183, no: 1422, title: 'Maximum Score After Splitting a String', topic: 'String', hints: [
    'Score = count of 0s in left part + count of 1s in right part.',
    'Precompute total 1s. Scan left to right tracking 0s in left and 1s remaining in right.',
    'let ones=[...s].filter(c=>c==="1").length,zeros=0,max=0;',
    'for(let i=0;i<s.length-1;i++){s[i]==="1"?ones--:zeros++; max=Math.max(max,zeros+ones);}',
    'return max;',
  ]},
  { order: 184, no: 1436, title: 'Destination City', topic: 'String, Hash Set', hints: [
    'The destination city never appears as a source.',
    'const sources=new Set(paths.map(p=>p[0])); return paths.find(p=>!sources.has(p[1]))[1];',
  ]},
  { order: 185, no: 1437, title: 'Check If All 1s Are at Least Length K Places Away', topic: 'Array', hints: [
    'Track the index of the last 1 seen. If current 1 is too close, return false.',
    'let last=-k-1; for(let i=0;i<nums.length;i++){if(nums[i]===1){if(i-last<k)return false; last=i;}}',
    'return true;',
  ]},
  { order: 186, no: 1446, title: 'Consecutive Characters', topic: 'String', hints: [
    'Scan counting current run; reset on char change.',
    'let max=1,cur=1; for(let i=1;i<s.length;i++){s[i]===s[i-1]?cur++:cur=1; max=Math.max(max,cur);}',
    'return max;',
  ]},
  { order: 187, no: 1450, title: 'Number of Students Doing Homework at a Given Time', topic: 'Array, Simulation', hints: [
    'Count students where startTime[i] <= queryTime <= endTime[i].',
    'return startTime.filter((_,i)=>startTime[i]<=queryTime&&queryTime<=endTime[i]).length;',
  ]},
  { order: 188, no: 1455, title: 'Check If a Word Occurs As a Prefix of Any Word in a Sentence', topic: 'String', hints: [
    'Split sentence into words. Find first word that starts with searchWord.',
    'return sentence.split(" ").findIndex(w=>w.startsWith(searchWord))+1||(-1);',
    'findIndex returns -1 if not found. Add 1 for 1-indexed; if 0 (not found+1), return -1.',
  ]},
  { order: 189, no: 1460, title: 'Make Two Arrays Equal by Reversing Subarrays', topic: 'Array, Sorting', hints: [
    'Any array can be rearranged into any order by reversing subarrays — they just need the same elements.',
    'return [...arr].sort((a,b)=>a-b).join()===([...target].sort((a,b)=>a-b).join());',
  ]},
  { order: 190, no: 1470, title: 'Shuffle the Array', topic: 'Array', hints: [
    'Interleave first half and second half: [x1,y1,x2,y2,...,xn,yn].',
    'return nums.flatMap((_,i)=>i<n?[nums[i],nums[i+n]]:[]).slice(0,2*n);',
    'Or: const res=[]; for(let i=0;i<n;i++){res.push(nums[i],nums[i+n]);} return res;',
  ]},
  { order: 191, no: 1475, title: 'Final Prices With a Special Discount in a Shop', topic: 'Array, Stack, Monotonic Stack', hints: [
    'For each price, find the next price that is ≤ it (next smaller or equal).',
    'Monotonic stack: push indices; when smaller found, apply discount to stacked indices.',
    'const res=[...prices]; const st=[];',
    'for(let i=0;i<prices.length;i++){while(st.length&&prices[st.at(-1)]>=prices[i])res[st.pop()]-=prices[i]; st.push(i);}',
    'return res;',
  ]},
  { order: 192, no: 1491, title: 'Average Salary Excluding the Minimum and Maximum Salary', topic: 'Array, Sorting', hints: [
    'Remove min and max, average the rest.',
    'return (salary.reduce((a,b)=>a+b,0)-Math.min(...salary)-Math.max(...salary))/(salary.length-2);',
  ]},
  { order: 193, no: 1496, title: 'Path Crossing', topic: 'String, Hash Set', hints: [
    'Track visited coordinates. Add current position as a string key to the Set.',
    'const visited=new Set(["0,0"]); let [x,y]=[0,0];',
    'for(const c of path){c==="N"?y++:c==="S"?y--:c==="E"?x++:x--; const key=`${x},${y}`; if(visited.has(key))return true; visited.add(key);}',
    'return false;',
  ]},
  { order: 194, no: 1502, title: 'Can Make Arithmetic Progression From Sequence', topic: 'Array, Sorting', hints: [
    'Sort and check if all consecutive differences are equal.',
    'arr.sort((a,b)=>a-b); const d=arr[1]-arr[0]; return arr.every((_,i)=>i<2||arr[i]-arr[i-1]===d);',
  ]},
  { order: 195, no: 1507, title: 'Reformat Date', topic: 'String', hints: [
    'Parse day, month name, year. Map month name to month number.',
    'const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];',
    'const [d,m,y]=date.split(" "); const day=d.replace(/\\D/g,"").padStart(2,"0"); const month=String(months.indexOf(m)+1).padStart(2,"0");',
    'return `${y}-${month}-${day}`;',
  ]},
  { order: 196, no: 1518, title: 'Water Bottles', topic: 'Math, Simulation', hints: [
    'Drink all full bottles; trade empties for new bottles at rate numExchange.',
    'let total=numBottles,empties=numBottles;',
    'while(empties>=numExchange){const new_=(empties/numExchange)|0; total+=new_; empties=empties%numExchange+new_;}',
    'return total;',
  ]},
  { order: 197, no: 1534, title: 'Count Good Triplets', topic: 'Array', hints: [
    'Brute force O(n³): three nested loops, check all three conditions.',
    'let count=0; for(let i=0;i<arr.length-2;i++) for(let j=i+1;j<arr.length-1;j++){if(Math.abs(arr[i]-arr[j])>a)continue; for(let k=j+1;k<arr.length;k++) if(Math.abs(arr[j]-arr[k])<=b&&Math.abs(arr[i]-arr[k])<=c)count++;}',
    'return count; // n<=100 so O(n³) is acceptable',
  ]},
  { order: 198, no: 1539, title: 'Kth Missing Positive Number', topic: 'Array, Binary Search', hints: [
    'Simple: count how many numbers ≤ arr[i] are missing. Walk up to find the kth.',
    'let missing=0,num=1,i=0; while(missing<k){if(i<arr.length&&arr[i]===num){i++;}else{missing++;} if(missing<k)num++;} return num;',
    'Binary search: missing before index i = arr[i]-(i+1). Find smallest index where missing >= k.',
  ]},
  { order: 199, no: 1544, title: 'Make The String Great', topic: 'String, Stack', hints: [
    'Two adjacent chars are "bad" if same letter, opposite case. Use a stack.',
    'const st=[]; for(const c of s){if(st.length&&st.at(-1)!==c&&st.at(-1).toLowerCase()===c.toLowerCase())st.pop(); else st.push(c);}',
    'return st.join("");',
  ]},
  { order: 200, no: 1550, title: 'Three Consecutive Odds', topic: 'Array', hints: [
    'Count consecutive odd numbers; reset on even.',
    'let count=0; for(const n of arr){n%2?count++:count=0; if(count===3)return true;}',
    'return false;',
  ]},
  { order: 201, no: 1556, title: 'Thousand Separator', topic: 'String, Math', hints: [
    'Convert to string, insert "." every 3 chars from the right.',
    'const s=String(n); return s.replace(/(\\d)(?=(\\d{3})+$)/g,"$1.");',
    'Or: reverse, chunk by 3, join with ".", reverse each chunk and the whole.',
  ]},
  { order: 202, no: 1560, title: 'Most Visited Sector in a Circular Track', topic: 'Array, Simulation', hints: [
    'Key insight: only the first and last rounds matter. Count sectors traversed in each.',
    'If rounds[0]<=rounds[last]: return [rounds[0]..rounds[last]].',
    'Else: return [1..rounds[last]] and [rounds[0]..n].',
    'const [start,end]=[rounds[0],rounds[rounds.length-1]]; return start<=end?Array.from({length:end-start+1},(_,i)=>i+start):[...Array.from({length:end},(_,i)=>i+1),...Array.from({length:n-start+1},(_,i)=>i+start)];',
  ]},
  { order: 203, no: 1566, title: 'Detect Pattern of Length M Repeated K or More Times', topic: 'Array', hints: [
    'Check every starting position: does the pattern of length m repeat k times consecutively?',
    'for(let i=0;i<=arr.length-m*k;i++){let j=0; while(j<m*(k-1)&&arr[i+j]===arr[i+j+m])j++; if(j===m*(k-1))return true;}',
    'return false;',
  ]},
  { order: 204, no: 1572, title: 'Matrix Diagonal Sum', topic: 'Array, Matrix', hints: [
    'Sum primary diagonal (i,i) and secondary diagonal (i,n-1-i). Subtract center if n is odd.',
    'const n=mat.length; let sum=0; for(let i=0;i<n;i++)sum+=mat[i][i]+mat[i][n-1-i];',
    'if(n%2)sum-=mat[n>>1][n>>1]; return sum;',
  ]},
  { order: 205, no: 1576, title: 'Replace All s to Avoid Consecutive Repeating Characters', topic: 'String', hints: [
    'Replace each "?" with any char that differs from its left and right neighbors.',
    'const a=[...s]; for(let i=0;i<a.length;i++){if(a[i]==="?"){for(const c of "abcdefghijklmnopqrstuvwxyz"){if(c!==a[i-1]&&c!==a[i+1]){a[i]=c;break;}}}}',
    'return a.join("");',
  ]},
  { order: 206, no: 1582, title: 'Special Positions in a Binary Matrix', topic: 'Array, Matrix', hints: [
    'A position (i,j) is special if mat[i][j]===1 and entire row i and column j are 0 (except this cell).',
    'Precompute row sums and column sums. Special if rowSum[i]===1 && colSum[j]===1.',
    'const rowSum=mat.map(r=>r.reduce((a,b)=>a+b,0)); const colSum=mat[0].map((_,j)=>mat.reduce((s,r)=>s+r[j],0));',
    'return mat.reduce((cnt,row,i)=>cnt+row.reduce((c,v,j)=>c+(v&&rowSum[i]===1&&colSum[j]===1?1:0),0),0);',
  ]},
  { order: 207, no: 1588, title: 'Sum of All Odd Length Subarrays', topic: 'Array, Math', hints: [
    'Generate all odd-length subarrays (length 1,3,5,...) and sum their elements.',
    'let sum=0; for(let len=1;len<=arr.length;len+=2) for(let i=0;i+len<=arr.length;i++) for(let j=i;j<i+len;j++) sum+=arr[j];',
    'Better: for each element arr[i], count how many odd-length subarrays include it.',
  ]},
  { order: 208, no: 1592, title: 'Rearrange Spaces Between Words', topic: 'String', hints: [
    'Count total spaces and words. Distribute spaces evenly between words.',
    'const words=s.trim().split(/\\s+/),spaces=(s.match(/ /g)||[]).length;',
    'if(words.length===1)return words[0]+" ".repeat(spaces); const gap=spaces/(words.length-1)|0,extra=spaces%(words.length-1);',
    'return words.join(" ".repeat(gap))+" ".repeat(extra);',
  ]},
  { order: 209, no: 1598, title: 'Crawler Log Folder', topic: 'String, Stack', hints: [
    '"../" goes up one level (if not already at root). "./" stays. Else go deeper.',
    'let depth=0; for(const op of logs){if(op==="./")continue; else if(op==="../")depth=Math.max(0,depth-1); else depth++;}',
    'return depth;',
  ]},
  { order: 210, no: 1603, title: 'Design Parking System', topic: 'Design, Simulation', hints: [
    'Track available spaces for each type (big=1, medium=2, small=3).',
    'class ParkingSystem{constructor(big,medium,small){this.spaces=[0,big,medium,small];} addCar(t){return this.spaces[t]-->0;}}',
  ]},
  { order: 211, no: 1608, title: 'Special Array With X Elements Greater Than or Equal X', topic: 'Array, Binary Search, Sorting', hints: [
    'Sort descending. Find x where exactly x elements are >= x.',
    'nums.sort((a,b)=>b-a);',
    'for(let x=0;x<=nums.length;x++) if((nums[x-1]??Infinity)>=x&&(nums[x]??0)<x)return x;',
    'return -1;',
  ]},
  { order: 212, no: 1614, title: 'Maximum Nesting Depth of the Parentheses', topic: 'String, Stack', hints: [
    'Track depth: increment on "(", decrement on ")". Record max depth.',
    'let depth=0,max=0; for(const c of s){if(c==="(")max=Math.max(max,++depth); else if(c===")")depth--;}',
    'return max;',
  ]},
  { order: 213, no: 1619, title: 'Mean of Array After Removing Some Elements', topic: 'Array, Sorting', hints: [
    'Remove bottom 5% and top 5% (trim = arr.length * 0.05 elements each end).',
    'arr.sort((a,b)=>a-b); const trim=arr.length/20; const trimmed=arr.slice(trim,-trim);',
    'return trimmed.reduce((a,b)=>a+b,0)/trimmed.length;',
  ]},
  { order: 214, no: 1624, title: 'Largest Substring Between Two Equal Characters', topic: 'String, Hash Map', hints: [
    'Track first occurrence index of each char. When char seen again, compute distance.',
    'const first={}; let max=-1;',
    'for(let i=0;i<s.length;i++){if(first[s[i]]!==undefined)max=Math.max(max,i-first[s[i]]-1); else first[s[i]]=i;}',
    'return max;',
  ]},
  { order: 215, no: 1629, title: 'Slowest Key', topic: 'Array, String', hints: [
    'Duration of key i = releaseTimes[i] - releaseTimes[i-1] (0 for i=0).',
    'Track max duration and corresponding key.',
    'let maxDur=releaseTimes[0],key=keysPressed[0];',
    'for(let i=1;i<releaseTimes.length;i++){const dur=releaseTimes[i]-releaseTimes[i-1]; if(dur>maxDur||dur===maxDur&&keysPressed[i]>key){maxDur=dur;key=keysPressed[i];}}',
    'return key;',
  ]},
  { order: 216, no: 1636, title: 'Sort Array by Increasing Frequency', topic: 'Array, Sorting, Hash Map', hints: [
    'Count frequencies. Sort by frequency ascending, then by value descending on ties.',
    'const freq={}; for(const n of nums) freq[n]=(freq[n]||0)+1;',
    'return nums.sort((a,b)=>freq[a]-freq[b]||b-a);',
  ]},
  { order: 217, no: 1637, title: 'Widest Vertical Area Between Two Points Containing No Points', topic: 'Array, Sorting', hints: [
    'Only x-coordinates matter. Sort them, find maximum gap between consecutive x values.',
    'const xs=points.map(p=>p[0]).sort((a,b)=>a-b);',
    'return Math.max(...xs.slice(1).map((x,i)=>x-xs[i]));',
  ]},
  { order: 218, no: 1640, title: 'Check Array Formation Through Concatenation', topic: 'Array, Hash Map', hints: [
    'Map the first element of each piece to the piece. Then try to assemble arr from those pieces.',
    'const map=new Map(pieces.map(p=>[p[0],p])); let i=0;',
    'while(i<arr.length){const piece=map.get(arr[i]); if(!piece)return false; for(const v of piece){if(arr[i++]!==v)return false;}}',
    'return true;',
  ]},
  { order: 219, no: 1646, title: 'Get Maximum in Generated Array', topic: 'Array, Simulation', hints: [
    'Build the array: nums[2i]=nums[i], nums[2i+1]=nums[i]+nums[i+1].',
    'if(n===0)return 0; const nums=[0,1]; for(let i=1;2*i+1<=n;i++){nums[2*i]=nums[i]; nums[2*i+1]=nums[i]+nums[i+1];}',
    'return Math.max(...nums);',
  ]},
  { order: 220, no: 1652, title: 'Defuse the Bomb', topic: 'Array, Sliding Window', hints: [
    'Circular array. k>0: sum next k. k<0: sum previous |k|. k=0: all zeros.',
    'if(k===0)return new Array(code.length).fill(0);',
    'const n=code.length,res=[]; for(let i=0;i<n;i++){let sum=0; for(let j=1;j<=Math.abs(k);j++)sum+=code[(i+(k>0?j:-j)+n*2)%n]; res.push(sum);}',
    'return res;',
  ]},
  { order: 221, no: 1668, title: 'Maximum Repeating Substring', topic: 'String', hints: [
    'Check if word repeated k times is a substring of sequence. Increment k until no longer found.',
    'let k=0; while(sequence.includes(word.repeat(k+1)))k++;',
    'return k;',
  ]},
  { order: 222, no: 1688, title: 'Count of Matches in Tournament', topic: 'Math, Simulation', hints: [
    'Each match eliminates one team. n-1 matches total to get 1 winner.',
    'return n-1;',
    'Simulate: while(n>1){n=n%2?Math.floor(n/2)+1:n/2; // half move on (odd: 1 bye)} — but shortcut is n-1.',
  ]},
  { order: 223, no: 1694, title: 'Reformat Phone Number', topic: 'String, Simulation', hints: [
    'Remove spaces and dashes. Group into blocks of 3. Handle remainder of 1→split last block to 2+2.',
    'const digits=number.replace(/[ -]/g,""); const parts=[];',
    'let i=0; while(i<digits.length){if(digits.length-i===4){parts.push(digits.slice(i,i+2),digits.slice(i+2,i+4));i+=4;}else{parts.push(digits.slice(i,i+3));i+=3;}}',
    'return parts.join("-");',
  ]},
  { order: 224, no: 1700, title: 'Number of Students Unable to Eat Lunch', topic: 'Array, Stack, Queue, Simulation', hints: [
    'Count students preferring 0s and 1s. Process sandwiches: if top matches any student, serve; else break.',
    'let ones=students.filter(s=>s).length,zeros=students.length-ones;',
    'for(const s of sandwiches){if(s===0){if(!zeros)break; zeros--;}else{if(!ones)break; ones--;}}',
    'return zeros+ones;',
  ]},
  { order: 225, no: 1704, title: 'Determine if String Halves Are Alike', topic: 'String, Hash Set', hints: [
    'Count vowels in first half vs second half.',
    'const vowels=new Set("aeiouAEIOU"); const n=s.length/2;',
    'return [...s.slice(0,n)].filter(c=>vowels.has(c)).length===[...s.slice(n)].filter(c=>vowels.has(c)).length;',
  ]},
  { order: 226, no: 1710, title: 'Maximum Units on a Truck', topic: 'Array, Sorting, Greedy', hints: [
    'Sort by units per box descending. Greedily pick boxes with most units first.',
    'boxTypes.sort((a,b)=>b[1]-a[1]); let total=0;',
    'for(const [boxes,units] of boxTypes){const take=Math.min(boxes,truckSize); total+=take*units; truckSize-=take; if(!truckSize)break;}',
    'return total;',
  ]},
  { order: 227, no: 1716, title: 'Calculate Money in Leetcode Bank', topic: 'Math, Greedy', hints: [
    'Week w (1-indexed): days are w, w+1, ..., w+6. Sum each full week + partial last week.',
    'const weeks=Math.floor(n/7),rem=n%7;',
    'let total=0; for(let w=0;w<weeks;w++) total+=(1+2+3+4+5+6+7)+w*7; // 28 + 7w per week',
    'for(let d=0;d<rem;d++) total+=(weeks+1)+d; return total;',
  ]},
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const deleted = await LeetCodeProblem.deleteMany({ list: 'javascript' });
  console.log(`Cleared ${deleted.deletedCount} existing JavaScript problems.`);

  const slugify = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const docs = JS_PROBLEMS.map((p) => ({
    title: p.title,
    leetcodeNo: p.no,
    leetcodeUrl: `https://leetcode.com/problems/${slugify(p.title)}/`,
    list: 'javascript',
    topic: p.topic,
    hints: p.hints,
    order: p.order,
    isActive: true,
  }));

  await LeetCodeProblem.insertMany(docs);
  console.log(`✅ Inserted ${docs.length} JavaScript LeetCode problems.`);
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
