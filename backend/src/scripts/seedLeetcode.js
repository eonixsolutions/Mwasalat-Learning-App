import 'dotenv/config';
import mongoose from 'mongoose';
import LeetCodeProblem from '../modules/leetcode/leetcode-problem.model.js';

const GENERAL_PROBLEMS = [
  {
    order: 1, no: 1, title: 'Two Sum', topic: 'Array, Hash Map',
    hints: [
      'Use two nested loops to check every pair of numbers.',
      'For each pair (i, j) where i != j, check if nums[i] + nums[j] == target.',
      'When found: int* result = (int*)malloc(2 * sizeof(int)); result[0] = i; result[1] = j; *returnSize = 2; return result;',
    ],
  },
  {
    order: 2, no: 258, title: 'Add Digits', topic: 'Math',
    hints: [
      'Repeatedly sum the digits of num until it becomes a single digit.',
      'Extract digit: digit = num % 10; sum += digit; num /= 10. Replace num with sum.',
      'Repeat until num < 10. Example: 38 → 11 → 2.',
    ],
  },
  {
    order: 3, no: 344, title: 'Reverse String', topic: 'String, Two Pointers',
    hints: [
      'Use two pointers — one from start, one from end. Swap characters at both positions.',
      'Move pointers toward center and continue until they meet or cross.',
      'Modify the array in-place — no extra array needed.',
    ],
  },
  {
    order: 4, no: 1342, title: 'Number of Steps to Reduce a Number to Zero', topic: 'Math, Bit Manipulation',
    hints: [
      'Loop while num > 0, keeping a steps counter.',
      'If num is even: num /= 2. If num is odd: num -= 1. Increment steps each time.',
      'Bit check alternative: if (num & 1) it is odd. Right shift (num >>= 1) divides by 2.',
    ],
  },
  {
    order: 5, no: 1295, title: 'Find Numbers with Even Number of Digits', topic: 'Array, Math',
    hints: [
      'Count the digits of each number. A number has an even digit count if it falls in ranges: 10-99, 1000-9999, etc.',
      'Count digits using: int digits = 0; int temp = num; while(temp) { digits++; temp /= 10; }',
      'Return the count of numbers where digits % 2 == 0.',
    ],
  },
  {
    order: 6, no: 1108, title: 'Defanging an IP Address', topic: 'String',
    hints: [
      'Replace every "." in the address with "[.]".',
      'Allocate result: char* result = (char*)malloc((strlen(address) + 2 * count + 1) * sizeof(char)); where count = number of dots.',
      'Traverse the string: copy chars as-is, but when you see a ".", write "[.]" into result instead.',
    ],
  },
  {
    order: 7, no: 1512, title: 'Number of Good Pairs', topic: 'Array, Hash Map',
    hints: [
      'A good pair is (i, j) where i < j and nums[i] == nums[j].',
      'Use a frequency array: int freq[101] = {0}.',
      'For each element, the number of new good pairs it forms = freq[nums[i]] (count of same value seen before). Then increment freq[nums[i]].',
    ],
  },
  {
    order: 8, no: 26, title: 'Remove Duplicates from Sorted Array', topic: 'Array, Two Pointers',
    hints: [
      'The array is already sorted — duplicates are adjacent.',
      'Use a write pointer k starting at 1. Traverse from index 1.',
      'If nums[i] != nums[i-1], it is a new unique value: nums[k++] = nums[i]. Return k.',
    ],
  },
  {
    order: 9, no: 1528, title: 'Shuffle String', topic: 'Array, String',
    hints: [
      'Place each character s[i] at position indices[i] in the result.',
      'Allocate: char* result = (char*)malloc((n + 1) * sizeof(char)); result[n] = \'\\0\';',
      'Loop: result[indices[i]] = s[i]; for each i. Then return result.',
    ],
  },
  {
    order: 10, no: 1323, title: 'Maximum 69 Number', topic: 'Math, Greedy',
    hints: [
      'Replace the first (leftmost) digit 6 with 9 to get the maximum value.',
      'Find the largest power of 10 where the digit is 6.',
      'Traverse digits from highest to lowest: if digit == 6, add 3 * (current place value) and break.',
    ],
  },
  {
    order: 11, no: 35, title: 'Search Insert Position', topic: 'Array, Binary Search',
    hints: [
      'Traverse the array. If nums[i] == target, return i. If nums[i] > target, return i.',
      'If target is larger than all elements, return numsSize.',
      'Binary search: lo=0, hi=numsSize. while(lo<hi){mid=(lo+hi)/2; nums[mid]<target?lo=mid+1:hi=mid;} return lo;',
    ],
  },
  {
    order: 12, no: 1678, title: 'Goal Parser Interpretation', topic: 'String',
    hints: [
      'Replace "()" with "o" and "(al)" with "al". Characters that are single letters stay as-is.',
      'Allocate result: char* result = (char*)malloc((strlen(command) + 1) * sizeof(char));',
      'Traverse: if s[i]==\'(\' and s[i+1]==\')\' → write \'o\', skip 2. If s[i]==\'(\' and s[i+1]==\'a\' → write "al", skip 4. Else copy char.',
    ],
  },
  {
    order: 13, no: 1365, title: 'How Many Numbers Are Smaller Than the Current Number', topic: 'Array, Sorting',
    hints: [
      'For each element, count how many other elements are strictly smaller.',
      'Brute force: two loops — for each i, count j where nums[j] < nums[i].',
      'Store results: int* result = (int*)malloc(numsSize * sizeof(int)); *returnSize = numsSize; return result;',
    ],
  },
  {
    order: 14, no: 66, title: 'Plus One', topic: 'Array, Math',
    hints: [
      'Traverse from the last digit. Add 1 to it. If it becomes 10, set to 0 and carry 1 to the previous digit.',
      'If carry propagates past index 0, the result has one extra digit: prepend 1 and all zeros.',
      'Allocate for the extra-digit case: int* result = (int*)malloc((digitsSize + 1) * sizeof(int)); *returnSize = digitsSize + 1;',
    ],
  },
  {
    order: 15, no: 136, title: 'Single Number', topic: 'Array, Bit Manipulation',
    hints: [
      'XOR of a number with itself is 0. XOR of a number with 0 is the number itself.',
      'XOR all elements together — every pair cancels out (a ^ a = 0), leaving the single number.',
      'int result = 0; for(int i=0;i<numsSize;i++) result ^= nums[i]; return result;',
    ],
  },
  {
    order: 16, no: 1523, title: 'Count Odd Numbers in an Interval Range', topic: 'Math',
    hints: [
      'Count of odd numbers from 1 to n = (n + 1) / 2 (integer division).',
      'Count in [low, high] = countOdds(high) - countOdds(low - 1).',
      'return (high + 1) / 2 - low / 2; (This is the clean one-liner formula.)',
    ],
  },
  {
    order: 17, no: 1389, title: 'Create Target Array in the Given Order', topic: 'Array',
    hints: [
      'Insert nums[i] at position index[i] in the target array — shift existing elements right.',
      'Allocate: int* target = (int*)malloc(numsSize * sizeof(int)); *returnSize = numsSize;',
      'For each insertion: memmove(&target[index[i]+1], &target[index[i]], (k-index[i])*sizeof(int)); target[index[i]]=nums[i]; where k is current size.',
    ],
  },
  {
    order: 18, no: 1480, title: 'Running Sum of 1d Array', topic: 'Array, Prefix Sum',
    hints: [
      'Running sum: result[i] = nums[0] + nums[1] + ... + nums[i].',
      'Allocate: int* result = (int*)malloc(numsSize * sizeof(int)); *returnSize = numsSize;',
      'result[0] = nums[0]; for(int i=1;i<numsSize;i++) result[i] = result[i-1] + nums[i]; return result;',
    ],
  },
  {
    order: 19, no: 1431, title: 'Kids With the Greatest Number of Candies', topic: 'Array',
    hints: [
      'Find the maximum candies any kid currently has.',
      'For each kid: if candies[i] + extraCandies >= maxCandies, they can have the most.',
      'Allocate: bool* result = (bool*)malloc(candiesSize * sizeof(bool)); *returnSize = candiesSize; result[i] = (candies[i] + extraCandies >= maxCandies);',
    ],
  },
  {
    order: 20, no: 771, title: 'Jewels and Stones', topic: 'String, Hash Set',
    hints: [
      'For each character in stones, check if it appears in jewels.',
      'Use nested loops or a frequency array: int jewel[128] = {0}; mark jewel types.',
      'Count stones where jewel[(int)stones[i]] is set. Return the count.',
    ],
  },
  {
    order: 21, no: 9, title: 'Palindrome Number', topic: 'Math',
    hints: [
      'Negative numbers are never palindromes. Store the original value.',
      'Reverse the number: while(n) { rev = rev*10 + n%10; n /= 10; }',
      'Compare reversed with original. If equal, return true.',
    ],
  },
  {
    order: 22, no: 1464, title: 'Maximum Product of Two Elements in an Array', topic: 'Array, Sorting',
    hints: [
      'You need the two largest values in the array. Product = (max1 - 1) * (max2 - 1).',
      'Find max1 and max2 in one pass.',
      'int max1=0, max2=0; for each n: if n>max1 {max2=max1; max1=n;} else if n>max2 {max2=n;} return (max1-1)*(max2-1);',
    ],
  },
  {
    order: 23, no: 27, title: 'Remove Element', topic: 'Array, Two Pointers',
    hints: [
      'Use a write pointer k starting at 0. Traverse the array.',
      'If nums[i] != val, write nums[k++] = nums[i].',
      'Elements equal to val are simply skipped. Return k (the count of remaining elements).',
    ],
  },
  {
    order: 24, no: 20, title: 'Valid Parentheses', topic: 'String, Stack',
    hints: [
      'Use a stack (char array). Push opening brackets. On closing bracket, check if top matches.',
      'char stack[10001]; int top = 0; Push: stack[top++] = c; Pop: top--;',
      'If stack is empty and a closing bracket arrives, return false. At the end, return top == 0.',
    ],
  },
  {
    order: 25, no: 58, title: 'Length of Last Word', topic: 'String',
    hints: [
      'Traverse from the end. Skip any trailing spaces first.',
      'Then count characters until a space or the start of the string.',
      'int len = 0, i = strlen(s)-1; while(i>=0&&s[i]==\' \')i--; while(i>=0&&s[i]!=\' \'){len++;i--;} return len;',
    ],
  },
  {
    order: 26, no: 70, title: 'Climbing Stairs', topic: 'Dynamic Programming',
    hints: [
      'To reach step n, you can come from step n-1 (1 step) or step n-2 (2 steps).',
      'ways(n) = ways(n-1) + ways(n-2). This is the Fibonacci sequence.',
      'int a=1, b=1; for(int i=2;i<=n;i++){int c=a+b; a=b; b=c;} return b;',
    ],
  },
  {
    order: 27, no: 88, title: 'Merge Sorted Array', topic: 'Array, Two Pointers',
    hints: [
      'Merge from the END to avoid overwriting nums1 elements.',
      'Three pointers: p1 = m-1, p2 = n-1, p = m+n-1.',
      'while(p2>=0) { nums1[p--] = (p1>=0 && nums1[p1]>nums2[p2]) ? nums1[p1--] : nums2[p2--]; }',
    ],
  },
  {
    order: 28, no: 118, title: "Pascal's Triangle", topic: 'Array, Dynamic Programming',
    hints: [
      'Each row starts and ends with 1. Interior element = element above-left + element above-right.',
      'Allocate: int** result = (int**)malloc(numRows * sizeof(int*)); *returnSize = numRows; *returnColumnSizes = (int*)malloc(numRows * sizeof(int));',
      'For each row i: result[i] = (int*)malloc((i+1)*sizeof(int)); (*returnColumnSizes)[i] = i+1; result[i][0]=result[i][i]=1; for j: result[i][j]=result[i-1][j-1]+result[i-1][j];',
    ],
  },
  {
    order: 29, no: 121, title: 'Best Time to Buy and Sell Stock', topic: 'Array, Greedy',
    hints: [
      'Track the minimum price seen so far and the maximum profit.',
      'For each day: profit = prices[i] - minPrice. Update maxProfit if larger.',
      'If current price < minPrice, update minPrice. Single pass O(n).',
    ],
  },
  {
    order: 30, no: 125, title: 'Valid Palindrome', topic: 'String, Two Pointers',
    hints: [
      'Use two pointers — left and right. Skip non-alphanumeric characters on both sides.',
      'Convert uppercase to lowercase before comparing: tolower() from <ctype.h>.',
      'Check isalnum() to skip invalid chars. If characters differ, return false.',
    ],
  },
  {
    order: 31, no: 171, title: 'Excel Sheet Column Number', topic: 'Math, String',
    hints: [
      'It is base-26 with A=1, B=2, ..., Z=26.',
      'Process left to right: result = result * 26 + (columnTitle[i] - \'A\' + 1).',
      'int result = 0; for(int i=0;columnTitle[i];i++) result = result*26 + (columnTitle[i]-\'A\'+1); return result;',
    ],
  },
  {
    order: 32, no: 202, title: 'Happy Number', topic: 'Math, Cycle Detection',
    hints: [
      'Replace n with the sum of squares of its digits. Repeat.',
      'If n reaches 1, return true. If it enters a cycle (reaches 4), return false.',
      'Sum of squares: int sum=0; while(n){int d=n%10; sum+=d*d; n/=10;} n=sum;',
    ],
  },
  {
    order: 33, no: 231, title: 'Power of Two', topic: 'Math, Bit Manipulation',
    hints: [
      'A power of two has exactly one bit set in binary.',
      'Bit trick: n > 0 && (n & (n-1)) == 0.',
      'Or: while(n % 2 == 0) n /= 2; return n == 1;',
    ],
  },
  {
    order: 34, no: 242, title: 'Valid Anagram', topic: 'String, Hash Map',
    hints: [
      'If lengths differ, return false. Count character frequencies.',
      'int freq[26] = {0}; Increment for each char in s, decrement for each in t.',
      'If any freq[i] != 0 after both loops, return false.',
    ],
  },
  {
    order: 35, no: 263, title: 'Ugly Number', topic: 'Math',
    hints: [
      'Ugly numbers only have prime factors 2, 3, and 5. Also check n > 0.',
      'Divide by 2 while divisible. Do the same for 3 and 5.',
      'while(n%2==0)n/=2; while(n%3==0)n/=3; while(n%5==0)n/=5; return n==1;',
    ],
  },
  {
    order: 36, no: 283, title: 'Move Zeroes', topic: 'Array, Two Pointers',
    hints: [
      'Use a write pointer k. Traverse: for each non-zero element, write nums[k++] = nums[i].',
      'After placing all non-zero elements, fill remaining positions with 0.',
      'Modify in-place. No extra array needed.',
    ],
  },
  {
    order: 37, no: 292, title: 'Nim Game', topic: 'Math, Game Theory',
    hints: [
      'If n is a multiple of 4, the current player loses. Otherwise they win.',
      'Why: from any non-multiple-of-4, you can leave a multiple-of-4 for your opponent.',
      'return n % 4 != 0;',
    ],
  },
  {
    order: 38, no: 326, title: 'Power of Three', topic: 'Math',
    hints: [
      'Divide by 3 while divisible. If result reaches 1, it is a power of three.',
      'if(n<=0) return false; while(n%3==0) n/=3; return n==1;',
      'Math trick: 3^19 = 1162261467 is the largest power of 3 in int range. return n>0 && 1162261467%n==0;',
    ],
  },
  {
    order: 39, no: 345, title: 'Reverse Vowels of a String', topic: 'String, Two Pointers',
    hints: [
      'Use two pointers — left and right. Move each inward until both point to a vowel.',
      'Swap the vowels, then continue moving both pointers inward.',
      'Check vowels: strchr("aeiouAEIOU", s[i]) != NULL.',
    ],
  },
  {
    order: 40, no: 367, title: 'Valid Perfect Square', topic: 'Math, Binary Search',
    hints: [
      'Binary search for the integer square root. Check if mid * mid == num.',
      'long lo=1, hi=num; while(lo<=hi){long mid=lo+(hi-lo)/2; long sq=mid*mid; if(sq==num)return true; sq<num?lo=mid+1:hi=mid-1;}',
      'Use long to avoid integer overflow when computing mid*mid.',
    ],
  },
  {
    order: 41, no: 383, title: 'Ransom Note', topic: 'String, Hash Map',
    hints: [
      'Count frequency of each character in magazine.',
      'int freq[26] = {0}; for each char in magazine: freq[c-\'a\']++;',
      'For each char in ransomNote: if freq[c-\'a\'] == 0 return false; else freq[c-\'a\']--;',
    ],
  },
  {
    order: 42, no: 387, title: 'First Unique Character in a String', topic: 'String, Hash Map',
    hints: [
      'Count frequency of each character using an array of 26 for lowercase letters.',
      'int freq[26] = {0}; for each char: freq[s[i]-\'a\']++;',
      'Traverse again: return the index of the first char where freq[s[i]-\'a\'] == 1. Return -1 if none.',
    ],
  },
  {
    order: 43, no: 389, title: 'Find the Difference', topic: 'String, Bit Manipulation',
    hints: [
      'XOR all characters in both s and t. The extra character remains.',
      'char result = 0; for each char in s: result ^= c; for each char in t: result ^= c;',
      'Alternatively: sum of ASCII values of t minus sum of s, then convert to char.',
    ],
  },
  {
    order: 44, no: 392, title: 'Is Subsequence', topic: 'String, Two Pointers',
    hints: [
      'Use a pointer i for s. Scan through t character by character.',
      'Advance i whenever s[i] matches the current character of t.',
      'Return i == strlen(s) — all characters of s were matched in order.',
    ],
  },
  {
    order: 45, no: 409, title: 'Longest Palindrome', topic: 'String, Hash Map',
    hints: [
      'Count frequency of each character. All even-count chars can be fully used.',
      'For odd-count chars, use (count - 1). Add 1 at the end if any odd count exists (center char).',
      'int freq[128]={0}; int len=0,hasOdd=0; for each freq: len+=freq[i]/2*2; if(freq[i]%2)hasOdd=1; return len+hasOdd;',
    ],
  },
  {
    order: 46, no: 414, title: 'Third Maximum Number', topic: 'Array',
    hints: [
      'Maintain three distinct maximums: first, second, third (initialized to LLONG_MIN).',
      'Traverse: update the three maximums, skipping duplicates.',
      'If third was never updated (still LLONG_MIN), return first. Otherwise return third.',
    ],
  },
  {
    order: 47, no: 415, title: 'Add Strings', topic: 'String, Math',
    hints: [
      'Traverse both strings from the end. Add digits with carry.',
      'char* result = (char*)malloc((maxLen + 2) * sizeof(char)); Build result right-to-left then reverse.',
      'int i=strlen(num1)-1, j=strlen(num2)-1, carry=0; while(i>=0||j>=0||carry){ sum=(i>=0?num1[i--]-\'0\':0)+(j>=0?num2[j--]-\'0\':0)+carry; }',
    ],
  },
  {
    order: 48, no: 434, title: 'Number of Segments in a String', topic: 'String',
    hints: [
      'A segment starts when a non-space character is preceded by a space or start of string.',
      'Count transitions: if(s[i]!=\' \' && (i==0 || s[i-1]==\' \')) count++;',
      'Return count. Handle empty string by returning 0.',
    ],
  },
  {
    order: 49, no: 448, title: 'Find All Numbers Disappeared in an Array', topic: 'Array',
    hints: [
      'Use the array itself as a marker: for each value v, negate nums[abs(v)-1] if positive.',
      'After marking, indices where nums[i] > 0 correspond to missing numbers (i+1).',
      'Count missing first, then: int* result = (int*)malloc(count * sizeof(int)); *returnSize = count;',
    ],
  },
  {
    order: 50, no: 485, title: 'Max Consecutive Ones', topic: 'Array',
    hints: [
      'Traverse the array. Keep a counter for the current run of ones.',
      'Increment counter on 1, reset to 0 on 0. Track the maximum counter value.',
      'int cur=0, max=0; for each n: n?cur++:cur=0; if(cur>max)max=cur; return max;',
    ],
  },
  {
    order: 51, no: 492, title: 'Construct the Rectangle', topic: 'Math',
    hints: [
      'Find W closest to sqrt(area) such that area % W == 0 and L >= W.',
      'Start from sqrt(area) and decrease until you find a divisor.',
      'int* result = (int*)malloc(2 * sizeof(int)); *returnSize = 2; int w=(int)sqrt(area); while(area%w)w--; result[0]=area/w; result[1]=w; return result;',
    ],
  },
  {
    order: 52, no: 495, title: 'Teemo Attacking', topic: 'Array, Simulation',
    hints: [
      'For each attack at timeSeries[i], the poison lasts min(duration, gap to next attack).',
      'Gap = timeSeries[i+1] - timeSeries[i]. The last attack always contributes full duration.',
      'int total=0; for(int i=0;i<timeSeriesSize-1;i++) total+=fmin(duration,timeSeries[i+1]-timeSeries[i]); return total+duration;',
    ],
  },
  {
    order: 53, no: 507, title: 'Perfect Number', topic: 'Math',
    hints: [
      'Sum all proper divisors of num (all divisors except num itself).',
      'Iterate up to sqrt(num): if num%i==0, add i and num/i (unless i==num/i).',
      'int sum=1; for(int i=2;(long)i*i<=num;i++) if(num%i==0){sum+=i; if(i!=num/i)sum+=num/i;} return num>1&&sum==num;',
    ],
  },
  {
    order: 54, no: 509, title: 'Fibonacci Number', topic: 'Dynamic Programming',
    hints: [
      'F(0)=0, F(1)=1, F(n) = F(n-1) + F(n-2).',
      'Use two variables: int a=0, b=1; iterate n times, swapping.',
      'for(int i=0;i<n;i++){int c=a+b; a=b; b=c;} return a;',
    ],
  },
  {
    order: 55, no: 520, title: 'Detect Capital', topic: 'String',
    hints: [
      'Three valid cases: all uppercase, all lowercase, or only first letter uppercase.',
      'Count uppercase letters using isupper() from <ctype.h>.',
      'If count==len (all caps) or count==0 (all lower) or (count==1 and isupper(word[0])): valid.',
    ],
  },
  {
    order: 56, no: 521, title: 'Longest Uncommon Subsequence I', topic: 'String',
    hints: [
      'If the two strings are equal, any subsequence of one is also a subsequence of the other — return -1.',
      'If they are different, the longer string itself is the longest uncommon subsequence.',
      'return strcmp(a, b) == 0 ? -1 : fmax(strlen(a), strlen(b));',
    ],
  },
  {
    order: 57, no: 541, title: 'Reverse String II', topic: 'String, Two Pointers',
    hints: [
      'Process the string in steps of 2k. At each step, reverse the first k characters of the chunk.',
      'for(int i=0;i<len;i+=2*k){ int l=i, r=fmin(i+k-1, len-1); while(l<r) swap s[l++] and s[r--]; }',
      'If fewer than k characters remain in the chunk, reverse all of them.',
    ],
  },
  {
    order: 58, no: 551, title: 'Student Attendance Record I', topic: 'String',
    hints: [
      'Return false if the string contains more than one \'A\', or three consecutive \'L\'s.',
      'Count A\'s: int aCount=0; for each char: if(c==\'A\')aCount++; if(aCount>1)return false.',
      'Check "LLL": use strstr(s, "LLL") != NULL to detect three consecutive L\'s.',
    ],
  },
  {
    order: 59, no: 557, title: 'Reverse Words in a String III', topic: 'String, Two Pointers',
    hints: [
      'Find start and end of each word (split by spaces). Reverse characters within each word.',
      'char* result = (char*)malloc((strlen(s) + 1) * sizeof(char)); strcpy(result, s);',
      'Traverse result: find word boundaries with spaces, then two-pointer reverse each word in-place.',
    ],
  },
  {
    order: 60, no: 605, title: 'Can Place Flowers', topic: 'Array, Greedy',
    hints: [
      'Greedily plant at every valid position: current cell is 0, and both neighbors are 0 (or boundary).',
      'If flowerbed[i]==0 && (i==0||flowerbed[i-1]==0) && (i==n-1||flowerbed[i+1]==0): plant here.',
      'Set flowerbed[i]=1, decrement n. If n<=0 at any point, return true.',
    ],
  },
  {
    order: 61, no: 643, title: 'Maximum Average Subarray I', topic: 'Array, Sliding Window',
    hints: [
      'Sliding window of fixed size k. Compute the initial sum of first k elements.',
      'Slide the window: add the incoming element, subtract the outgoing element. Track max sum.',
      'double maxSum = initial sum; for(i=k;i<n;i++){sum+=nums[i]-nums[i-k]; if(sum>maxSum)maxSum=sum;} return maxSum/k;',
    ],
  },
  {
    order: 62, no: 645, title: 'Set Mismatch', topic: 'Array, Hash Map',
    hints: [
      'Use a frequency array of size n+1. The element with freq 2 is the duplicate; freq 0 is the missing.',
      'int freq[n+1]; memset(freq,0,sizeof(freq)); for each num: freq[num]++;',
      'int* result = (int*)malloc(2 * sizeof(int)); *returnSize = 2; Find dup and missing from freq.',
    ],
  },
  {
    order: 63, no: 657, title: 'Robot Return to Origin', topic: 'String',
    hints: [
      'Track x and y coordinates. U/D cancel; L/R cancel.',
      'int x=0, y=0; for each move: U→y++, D→y--, L→x--, R→x++.',
      'Return x==0 && y==0.',
    ],
  },
  {
    order: 64, no: 674, title: 'Longest Continuous Increasing Subsequence', topic: 'Array',
    hints: [
      'Track current streak length. Reset to 1 when the sequence stops increasing.',
      'int cur=1, max=1; for(i=1;i<n;i++){nums[i]>nums[i-1]?cur++:cur=1; if(cur>max)max=cur;}',
      'Return max.',
    ],
  },
  {
    order: 65, no: 680, title: 'Valid Palindrome II', topic: 'String, Two Pointers, Greedy',
    hints: [
      'Two pointers from both ends. When a mismatch is found, try skipping the left OR the right character.',
      'Write a helper isPalin(s, l, r) that checks if s[l..r] is a palindrome.',
      'If s[l]!=s[r]: return isPalin(s,l+1,r) || isPalin(s,l,r-1);',
    ],
  },
  {
    order: 66, no: 709, title: 'To Lower Case', topic: 'String',
    hints: [
      'For each character, if it is uppercase (A-Z), convert to lowercase by adding 32.',
      'char* result = (char*)malloc((strlen(s) + 1) * sizeof(char));',
      'result[i] = (s[i]>=\'A\'&&s[i]<=\'Z\') ? s[i]+32 : s[i]; Then null-terminate.',
    ],
  },
  {
    order: 67, no: 717, title: '1-bit and 2-bit Characters', topic: 'Array',
    hints: [
      'Scan from left: if bits[i]==1, it starts a 2-bit character — skip i+=2. If bits[i]==0, it is a 1-bit character — i+=1.',
      'Continue until i reaches the last index.',
      'Return bits[i]==0 — the last character is a 1-bit character if i lands exactly on the last index with value 0.',
    ],
  },
  {
    order: 68, no: 724, title: 'Find Pivot Index', topic: 'Array, Prefix Sum',
    hints: [
      'For pivot index i: leftSum == rightSum, where rightSum = totalSum - leftSum - nums[i].',
      'Compute total sum first. Then traverse tracking leftSum.',
      'if(leftSum == totalSum - leftSum - nums[i]) return i; leftSum += nums[i];',
    ],
  },
  {
    order: 69, no: 728, title: 'Self Dividing Numbers', topic: 'Array, Math',
    hints: [
      'A number is self-dividing if it is divisible by each of its non-zero digits.',
      'For each number in [left, right]: extract each digit (n%10), check n%digit==0 and digit!=0.',
      'int* result = (int*)malloc((right-left+1)*sizeof(int)); *returnSize = 0; Add valid numbers to result.',
    ],
  },
  {
    order: 70, no: 744, title: 'Find Smallest Letter Greater Than Target', topic: 'Array, Binary Search',
    hints: [
      'The array is sorted. Find the first letter strictly greater than target.',
      'Linear scan: for each letter, if letter > target, return it. If none found, return letters[0] (wraps around).',
      'Binary search alternative: lo=0, hi=n; find first index where letters[mid]>target.',
    ],
  },
  {
    order: 71, no: 746, title: 'Min Cost Climbing Stairs', topic: 'Dynamic Programming',
    hints: [
      'dp[i] = minimum cost to reach step i. You can step from i-1 or i-2.',
      'dp[i] = cost[i] + min(dp[i-1], dp[i-2]).',
      'int a=cost[0], b=cost[1]; for(i=2;i<=n;i++){int c=(i<n?cost[i]:0)+fmin(a,b); a=b; b=c;} return b;',
    ],
  },
  {
    order: 72, no: 747, title: 'Largest Number At Least Twice of Others', topic: 'Array',
    hints: [
      'Find the maximum and the second maximum.',
      'If max >= 2 * secondMax for ALL other elements, return the index of max.',
      'int maxVal=0, maxIdx=0, secondMax=0; Scan to find max and its index, then verify against all others.',
    ],
  },
  {
    order: 73, no: 821, title: 'Shortest Distance to a Character', topic: 'Array, Two Pointers',
    hints: [
      'Two passes: left-to-right tracking the last seen position of c; right-to-left same.',
      'int* result = (int*)malloc(n * sizeof(int)); *returnSize = n;',
      'Pass 1: int prev=-n; for(i=0;i<n;i++){if(s[i]==c)prev=i; result[i]=abs(i-prev);} Pass 2: prev=2*n; scan right to left, update result[i]=min.',
    ],
  },
  {
    order: 74, no: 836, title: 'Rectangle Overlap', topic: 'Math, Geometry',
    hints: [
      'Two rectangles overlap if they overlap on BOTH the x-axis and the y-axis.',
      'No overlap on x: rec1[2]<=rec2[0] || rec2[2]<=rec1[0]. Same for y.',
      'return !(rec1[2]<=rec2[0]||rec1[0]>=rec2[2]||rec1[3]<=rec2[1]||rec1[1]>=rec2[3]);',
    ],
  },
  {
    order: 75, no: 860, title: 'Lemonade Change', topic: 'Array, Greedy',
    hints: [
      'Track count of $5 and $10 bills. Give change greedily — prefer $10 for $20 change.',
      '$5 bill: five++. $10 bill: if(five==0)return false; five--; ten++.',
      '$20 bill: if(ten>0&&five>0){ten--;five--;} else if(five>=3){five-=3;} else return false;',
    ],
  },
  {
    order: 76, no: 888, title: 'Fair Candy Swap', topic: 'Array, Hash Set, Math',
    hints: [
      'If Alice gives a and gets b: sumA - a + b == sumB - b + a → b = a + (sumB - sumA) / 2.',
      'Compute diff = (sumB - sumA) / 2. For each a in aliceSizes, check if a+diff exists in bobSizes.',
      'int* result = (int*)malloc(2 * sizeof(int)); *returnSize = 2; Use a bool array or hash to mark bobSizes.',
    ],
  },
  {
    order: 77, no: 896, title: 'Monotonic Array', topic: 'Array',
    hints: [
      'Check if the array is entirely non-decreasing OR entirely non-increasing.',
      'int inc=1, dec=1; for(i=1;i<n;i++){if(nums[i]>nums[i-1])dec=0; if(nums[i]<nums[i-1])inc=0;}',
      'Return inc || dec.',
    ],
  },
  {
    order: 78, no: 905, title: 'Sort Array By Parity', topic: 'Array, Two Pointers',
    hints: [
      'Two pointers: l from left, r from right. Swap when nums[l] is odd and nums[r] is even.',
      'int* result = (int*)malloc(numsSize * sizeof(int)); *returnSize = numsSize; memcpy(result, nums, numsSize*sizeof(int));',
      'Then apply two-pointer sort on result in-place. Or fill evens first then odds into result directly.',
    ],
  },
  {
    order: 79, no: 908, title: 'Smallest Range I', topic: 'Array, Math',
    hints: [
      'To minimize the score (max - min), raise the minimum by up to k and lower the maximum by up to k.',
      'New range = (max - k) - (min + k) = max - min - 2k.',
      'return fmax(0, max - min - 2*k);',
    ],
  },
  {
    order: 80, no: 917, title: 'Reverse Only Letters', topic: 'String, Two Pointers',
    hints: [
      'Two pointers from both ends. Skip non-letter characters. Swap only letters.',
      'char* result = (char*)malloc((strlen(s)+1)*sizeof(char)); strcpy(result,s);',
      'int l=0,r=strlen(result)-1; while(l<r){while(l<r&&!isalpha(result[l]))l++; while(l<r&&!isalpha(result[r]))r--; swap result[l++] and result[r--];} return result;',
    ],
  },
  {
    order: 81, no: 922, title: 'Sort Array By Parity II', topic: 'Array, Two Pointers',
    hints: [
      'Even-indexed positions need even numbers; odd-indexed positions need odd numbers.',
      'int* result = (int*)malloc(numsSize * sizeof(int)); *returnSize = numsSize;',
      'Two pointers j (odd index needing even) and i (even index). Scan even indices; when mismatch, find odd index with even value and swap.',
    ],
  },
  {
    order: 82, no: 925, title: 'Long Pressed Name', topic: 'String, Two Pointers',
    hints: [
      'Two pointers: i for name, j for typed. If chars match, advance both. If typed[j]==typed[j-1], skip (it is a long press). Else return false.',
      'int i=0, j=0; while(j<strlen(typed)){if(i<strlen(name)&&name[i]==typed[j])i++; else if(j>0&&typed[j]==typed[j-1]){}else return false; j++;}',
      'Return i == strlen(name) — all of name was matched.',
    ],
  },
  {
    order: 83, no: 941, title: 'Valid Mountain Array', topic: 'Array',
    hints: [
      'Must have at least 3 elements. Walk up from the left while increasing, then down while decreasing.',
      'int i=0; while(i<n-1&&arr[i]<arr[i+1])i++; if(i==0||i==n-1)return false;',
      'while(i<n-1&&arr[i]>arr[i+1])i++; return i==n-1;',
    ],
  },
  {
    order: 84, no: 942, title: 'DI String Match', topic: 'Array, Greedy',
    hints: [
      'Use a range [lo, hi] where lo=0 and hi=strlen(s).',
      '"I": assign lo (smallest available) — guarantees next can only be larger. "D": assign hi (largest available).',
      'int* result = (int*)malloc((n+1)*sizeof(int)); *returnSize = n+1; for each char: I→result[i]=lo++, D→result[i]=hi--; last element is lo (==hi).',
    ],
  },
  {
    order: 85, no: 961, title: 'N-Repeated Element in Size 2N Array', topic: 'Array, Hash Map',
    hints: [
      'The repeated element appears n times in a 2n array — by pigeonhole, two of any three consecutive elements must match.',
      'Check: if(nums[i]==nums[i-1]||nums[i]==nums[i-2]) return nums[i]; for i from 2.',
      'Or use a frequency array/hash set: the first element seen twice is the answer.',
    ],
  },
  {
    order: 86, no: 977, title: 'Squares of a Sorted Array', topic: 'Array, Two Pointers',
    hints: [
      'Sorted array may have negatives. Largest squares are at the two ends.',
      'int* result = (int*)malloc(numsSize * sizeof(int)); *returnSize = numsSize;',
      'Two pointers l=0, r=numsSize-1, fill result from the end: compare abs(nums[l]) and abs(nums[r]), place the larger square at result[pos--].',
    ],
  },
  {
    order: 87, no: 989, title: 'Add to Array-Form of Integer', topic: 'Array, Math',
    hints: [
      'Add k to the last element of num. Propagate carry from right to left.',
      'for(int i=n-1;i>=0&&k;i--){k+=num[i]; num[i]=k%10; k/=10;}',
      'If carry remains: prepend digits. Allocate result: count extra digits from k, then build: int* result = (int*)malloc((n+extraDigits)*sizeof(int)); *returnSize = n+extraDigits;',
    ],
  },
  {
    order: 88, no: 1013, title: 'Partition Array Into Three Parts With Equal Sum', topic: 'Array, Greedy',
    hints: [
      'Total sum must be divisible by 3. Find two split points where prefix sums hit sum/3 and 2*sum/3.',
      'int target = total/3; int count=0, running=0; for each num: running+=num; if(running==target*count+target)count++;',
      'Return count >= 3.',
    ],
  },
  {
    order: 89, no: 1021, title: 'Remove Outermost Parentheses', topic: 'String, Stack',
    hints: [
      'Track depth. Opening at depth 0 is an outer open — skip it. Closing that brings depth to 0 is an outer close — skip it.',
      'char* result = (char*)malloc((strlen(s)+1)*sizeof(char)); int depth=0, k=0;',
      'for each c: if(c==\'(\'){if(depth>0)result[k++]=c; depth++;} else{depth--; if(depth>0)result[k++]=c;} result[k]=\'\\0\';',
    ],
  },
  {
    order: 90, no: 1025, title: 'Divisor Game', topic: 'Math, Dynamic Programming',
    hints: [
      'Alice wins if and only if n is even.',
      'If n is even, Alice picks 1 (n-1 is odd for Bob). If n is odd, any divisor x is odd, so n-x is even — Bob gets even.',
      'return n % 2 == 0;',
    ],
  },
  {
    order: 91, no: 1046, title: 'Last Stone Weight', topic: 'Array, Sorting, Simulation',
    hints: [
      'Repeatedly smash the two heaviest stones. If equal, both destroyed; if not, the difference remains.',
      'Sort the array each round, then smash the last two elements.',
      'While more than 1 stone: sort ascending, diff=stones[n-1]-stones[n-2], remove both, push diff if nonzero.',
    ],
  },
  {
    order: 92, no: 1047, title: 'Remove All Adjacent Duplicates In String', topic: 'String, Stack',
    hints: [
      'Use a character stack. For each character: if it equals the top, pop (remove the pair). Else push.',
      'char* stack = (char*)malloc((strlen(s)+1)*sizeof(char)); int top=0;',
      'for each c: if(top>0&&stack[top-1]==c)top--; else stack[top++]=c; stack[top]=\'\\0\'; return stack;',
    ],
  },
  {
    order: 93, no: 1051, title: 'Height Checker', topic: 'Array, Sorting',
    hints: [
      'Compare the current order with the sorted (expected) order. Count positions that differ.',
      'int* expected = (int*)malloc(n*sizeof(int)); memcpy(expected, heights, n*sizeof(int)); sort expected.',
      'int count=0; for(i=0;i<n;i++) if(heights[i]!=expected[i]) count++; return count;',
    ],
  },
  {
    order: 94, no: 1089, title: 'Duplicate Zeros', topic: 'Array',
    hints: [
      'Modify in-place. Two-pass approach: count zeros that fit after shifting.',
      'Pass 1: count how many zeros would be duplicated within the array bounds.',
      'Pass 2: fill from the end using two pointers — place each element at its new shifted position.',
    ],
  },
  {
    order: 95, no: 1103, title: 'Distribute Candies to People', topic: 'Array, Math',
    hints: [
      'Give candies in rounds: person 0 gets 1, person 1 gets 2, ..., wrapping around.',
      'int* result = (int*)calloc(num_people, sizeof(int)); *returnSize = num_people;',
      'int give=1, i=0; while(candies>0){ result[i%num_people]+=fmin(give,candies); candies-=give; give++; i++; } return result;',
    ],
  },
  {
    order: 96, no: 1128, title: 'Number of Equivalent Domino Pairs', topic: 'Array, Hash Map',
    hints: [
      'Normalize each domino so the smaller value is first: (min(a,b), max(a,b)).',
      'Use a 2D frequency array: int freq[10][10]={0}; For each normalized domino, add freq[a][b] to count, then increment freq[a][b].',
      'int count=0; for each [a,b]: int x=fmin(a,b), y=fmax(a,b); count+=freq[x][y]; freq[x][y]++;',
    ],
  },
  {
    order: 97, no: 1137, title: 'N-th Tribonacci Number', topic: 'Dynamic Programming',
    hints: [
      'T(0)=0, T(1)=1, T(2)=1, T(n)=T(n-1)+T(n-2)+T(n-3).',
      'Use three variables: int a=0,b=1,c=1; for(i=3;i<=n;i++){int d=a+b+c; a=b; b=c; c=d;}',
      'Return n==0?0:n<=2?1:c;',
    ],
  },
  {
    order: 98, no: 1154, title: 'Day of the Year', topic: 'Math, String',
    hints: [
      'Parse year, month, day from the date string (sscanf or manual parsing).',
      'Sum days in preceding months. February has 29 days in a leap year.',
      'Leap year: (year%4==0 && year%100!=0) || year%400==0. int days[]={31,28+isLeap,31,30,31,30,31,31,30,31,30,31};',
    ],
  },
  {
    order: 99, no: 1184, title: 'Distance Between Bus Stops', topic: 'Array, Math',
    hints: [
      'Two routes: clockwise (from start to destination) and counter-clockwise.',
      'Clockwise sum: add distance[i] from start to destination (wrap with modulo).',
      'Counter-clockwise = total - clockwise. Return min(clockwise, total-clockwise).',
    ],
  },
  {
    order: 100, no: 1185, title: 'Day of the Week', topic: 'Math, String',
    hints: [
      'Use Tomohiko Sakamoto\'s algorithm or Zeller\'s congruence to find the day of the week.',
      'Alternatively, compute the day number from a known reference date (e.g., Jan 1, 1971 was a Friday).',
      'char* days[]={"Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"}; Use the algorithm to get an index 0-6, then return days[index]; (no malloc needed — return the literal).',
    ],
  },
];

const SLUG_MAP = {
  1:'two-sum', 9:'palindrome-number', 20:'valid-parentheses', 26:'remove-duplicates-from-sorted-array',
  27:'remove-element', 35:'search-insert-position', 58:'length-of-last-word', 66:'plus-one',
  70:'climbing-stairs', 88:'merge-sorted-array', 118:'pascals-triangle', 121:'best-time-to-buy-and-sell-stock',
  125:'valid-palindrome', 136:'single-number', 171:'excel-sheet-column-number', 202:'happy-number',
  231:'power-of-two', 242:'valid-anagram', 263:'ugly-number', 283:'move-zeroes', 292:'nim-game',
  326:'power-of-three', 344:'reverse-string', 345:'reverse-vowels-of-a-string', 367:'valid-perfect-square',
  383:'ransom-note', 387:'first-unique-character-in-a-string', 389:'find-the-difference',
  392:'is-subsequence', 409:'longest-palindrome', 414:'third-maximum-number', 415:'add-strings',
  434:'number-of-segments-in-a-string', 448:'find-all-numbers-disappeared-in-an-array',
  485:'max-consecutive-ones', 492:'construct-the-rectangle', 495:'teemo-attacking', 507:'perfect-number',
  509:'fibonacci-number', 520:'detect-capital', 521:'longest-uncommon-subsequence-i',
  541:'reverse-string-ii', 551:'student-attendance-record-i', 557:'reverse-words-in-a-string-iii',
  605:'can-place-flowers', 643:'maximum-average-subarray-i', 645:'set-mismatch',
  657:'robot-return-to-origin', 674:'longest-continuous-increasing-subsequence',
  680:'valid-palindrome-ii', 709:'to-lower-case', 717:'1-bit-and-2-bit-characters',
  724:'find-pivot-index', 728:'self-dividing-numbers', 744:'find-smallest-letter-greater-than-target',
  746:'min-cost-climbing-stairs', 747:'largest-number-at-least-twice-of-others',
  771:'jewels-and-stones', 821:'shortest-distance-to-a-character', 836:'rectangle-overlap',
  860:'lemonade-change', 888:'fair-candy-swap', 896:'monotonic-array', 905:'sort-array-by-parity',
  908:'smallest-range-i', 917:'reverse-only-letters', 922:'sort-array-by-parity-ii',
  925:'long-pressed-name', 941:'valid-mountain-array', 942:'di-string-match',
  961:'n-repeated-element-in-size-2n-array', 977:'squares-of-a-sorted-array',
  989:'add-to-array-form-of-integer', 1013:'partition-array-into-three-parts-with-equal-sum',
  1021:'remove-outermost-parentheses', 1025:'divisor-game', 1046:'last-stone-weight',
  1047:'remove-all-adjacent-duplicates-in-string', 1051:'height-checker', 1089:'duplicate-zeros',
  1103:'distribute-candies-to-people', 1108:'defanging-an-ip-address',
  1128:'number-of-equivalent-domino-pairs', 1137:'n-th-tribonacci-number',
  1154:'day-of-the-year', 1184:'distance-between-bus-stops', 1185:'day-of-the-week',
  1295:'find-numbers-with-even-number-of-digits', 1323:'maximum-69-number',
  1342:'number-of-steps-to-reduce-a-number-to-zero', 1365:'how-many-numbers-are-smaller-than-the-current-number',
  1389:'create-target-array-in-the-given-order', 1431:'kids-with-the-greatest-number-of-candies',
  1464:'maximum-product-of-two-elements-in-an-array', 1480:'running-sum-of-1d-array',
  1512:'number-of-good-pairs', 1523:'count-odd-numbers-in-an-interval-range',
  1528:'shuffle-string', 1678:'goal-parser-interpretation',
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const deleted = await LeetCodeProblem.deleteMany({ list: 'general' });
  console.log(`Cleared ${deleted.deletedCount} existing general problems.`);

  const docs = GENERAL_PROBLEMS.map((p) => ({
    title: p.title,
    leetcodeNo: p.no,
    leetcodeUrl: `https://leetcode.com/problems/${SLUG_MAP[p.no] ?? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/`,
    list: 'general',
    topic: p.topic,
    hints: p.hints,
    order: p.order,
    isActive: true,
  }));

  await LeetCodeProblem.insertMany(docs);
  console.log(`✅ Inserted ${docs.length} general LeetCode problems.`);
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
