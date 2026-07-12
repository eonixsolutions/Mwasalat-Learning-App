**Problem #:** **1**
**Language:** **C**

### Hints:

* Use two loops to check every pair of numbers
* For each pair, check:
  `nums[i] + nums[j] == target`
* If found, store both indexes in the result array
* Return the indexes

### Hint (Returning Array in C):

```c
int* result = (int*)malloc(2 * sizeof(int));

result[0] = i;
result[1] = j;

*returnSize = 2;
return result;
```
--------------------
**Problem #:** **121**
**Language:** **C**

### Hints:

* Keep track of the **minimum price** seen so far

* For each day, calculate:
  `prices[i] - minPrice`

* Update the maximum profit whenever a larger profit is found

* If current price is smaller than `minPrice`, update `minPrice`

* You only need one loop through the array
-------------------------
**Problem #:** **217**
**Language:** **C**

### Hints:

* Compare every element with the remaining elements
* Use two loops:

  * Outer loop for current element
  * Inner loop to check duplicates
* If:
  `nums[i] == nums[j]`
  return `true`
* If no duplicates are found after all comparisons, return `false`
--------------------------------
**Problem #:** **53**
**Language:** **C**

### Hints:

* Keep a variable for:

  * current sum
  * maximum sum
* Add each element to the current sum
* If current sum becomes larger than maximum sum, update maximum sum
* If current sum becomes negative, reset it to `0`
* The answer is the largest subarray sum found during traversal
------------------------
**Problem #:** **66**
**Language:** **C**

### Hints:

* Start checking digits from the last index
* Add `1` to the last digit
* If digit becomes `10`:

  * make it `0`
  * carry `1` to previous digit
* Continue until no carry remains
* If all digits become `0`, create a new array:
  `1 0 0 0 ...`

### Hint (Returning Array in C):

```c id="gq2f9k"
int* result = (int*)malloc((digitsSize + 1) * sizeof(int));

*returnSize = digitsSize + 1;
```
-----------------------------------
**Problem #:** **283**
**Language:** **C**

### Hints:

* Use a variable to track the position for the next non-zero element
* Traverse the array:

  * If element is not `0`, place it at the tracked position
  * Increment the position
* After placing all non-zero elements, fill remaining positions with `0`
* Modify the array in-place without creating another array
-----------------------------------
**Problem #:** **27**
**Language:** **C**

### Hints:

* Use a variable to track the position for valid elements
* Traverse the array:

  * If `nums[i] != val`
    place it at the tracked position
  * Increment the position
* Elements equal to `val` should be skipped
* Return the count of remaining elements
* Changes should be done in-place without using another array
---------------------------------
**Problem #:** **26**
**Language:** **C**

### Hints:

* Array is already sorted
* Use one variable to track the position of unique elements
* Traverse the array starting from index `1`
* If:
  `nums[i] != nums[i - 1]`
  store the element at the next unique position
* Increment the unique position count
* Return the number of unique elements
* Modify the array in-place without using another array
----------------------------------
**Problem #:** **35**
**Language:** **C**

### Hints:

* Traverse the array and compare each element with `target`
* If:
  `nums[i] == target`
  return the index
* If:
  `nums[i] > target`
  return the current index because target should be inserted there
* If target is greater than all elements, return `numsSize`
-----------------------------------
**Problem #:** **88**
**Language:** **C**

### Hints:

* Start comparing elements from the end of both arrays
* Use three indexes:

  * Last valid element in `nums1`
  * Last element in `nums2`
  * Last position in merged array
* Place the larger element at the end position
* Move indexes accordingly
* Continue until all elements from `nums2` are placed
* Fill `nums1` in-place without using another array
------------------------------
**Problem #:** **9**
**Language:** **C**

### Hints:

* Negative numbers cannot be palindrome
* Store the original number in another variable
* Reverse the number using:

  * remainder `% 10`
  * division `/ 10`
* Compare:
  `original == reversed`
* If equal, return `true`
  otherwise return `false`
---------------------------
**Problem #:** **7**
**Language:** **C**

### Hints:

* Extract digits one by one using:
  `x % 10`
* Build the reversed number:
  `reverse = reverse * 10 + digit`
* Remove last digit using:
  `x = x / 10`
* Before updating reverse, check for overflow:

  * greater than `INT_MAX`
  * smaller than `INT_MIN`
* If overflow happens, return `0`
-------------------
**Problem #:** **13**
**Language:** **C**

### Hints:

* Convert each Roman character to its integer value
* Traverse the string from left to right
* If current value is smaller than next value:
  subtract it
* Otherwise:
  add it
* Common values:

  * `I = 1`
  * `V = 5`
  * `X = 10`
  * `L = 50`
  * `C = 100`
  * `D = 500`
  * `M = 1000`
--------------------------
**Problem #:** **412**
**Language:** **C**

### Hints:

* Traverse numbers from `1` to `n`
* For each number:

  * If divisible by both `3` and `5`, store `"FizzBuzz"`
  * If divisible only by `3`, store `"Fizz"`
  * If divisible only by `5`, store `"Buzz"`
  * Otherwise, convert the number to string and store it

### Hint (Returning Array in C):

```c id="w2d8jk"
char** result = (char**)malloc(n * sizeof(char*));

*returnSize = n;
```

### Hint (Storing Strings):

```c id="n3v0yh"
result[i] = (char*)malloc(20 * sizeof(char));

sprintf(result[i], "%d", i + 1);
```
----------------------------
**Problem #:** **204**
**Language:** **C**

### Hints:

* Count how many prime numbers are smaller than `n`
* Create a boolean array to mark prime numbers
* Initially mark all numbers as prime
* Start from `2`
* If a number is prime:

  * count it
  * mark all its multiples as non-prime
* Multiples can be marked using:
  `for(j = i * 2; j < n; j += i)`
* `0` and `1` are not prime numbers
-----------------------------------
**Problem #:** **231**
**Language:** **C**

### Hints:

* A power of `2` can be divided by `2` repeatedly

* Examples:

  * `8 → 4 → 2 → 1`
  * `16 → 8 → 4 → 2 → 1`

* While number is divisible by `2`:

  ```c
  n = n / 2;
  ```

* If final value becomes `1`, return `true`

* If it stops before reaching `1`, return `false`

* Also check:
  `n > 0`
-------------------------------
**Problem #:** **326**
**Language:** **C**

### Hints:

* A power of `3` can be divided by `3` repeatedly

* Examples:

  * `27 → 9 → 3 → 1`
  * `81 → 27 → 9 → 3 → 1`

* While number is divisible by `3`:

  ```c
  n = n / 3;
  ```

* If final value becomes `1`, return `true`

* Otherwise return `false`

* Also check:
  `n > 0`
------------------------
**Problem #:** **202**
**Language:** **C**

### Hints:

* Find sum of squares of digits

* Example:

  ```c
  digit = n % 10;
  sum += digit * digit;
  n = n / 10;
  ```

* Replace `n` with the new sum

* Continue the process repeatedly

* If number becomes `1`, return `true`

* If the process starts repeating endlessly, return `false`

* You can use a loop with a limit or check for repeated values like `4` which enters a cycle
----------------------
**Problem #:** **258**
**Language:** **C**

### Hints:

* Find sum of digits using:

  ```c
  digit = n % 10;
  sum += digit;
  n = n / 10;
  ```

* After calculating the sum:

  * replace original number with the new sum

* Repeat until number becomes a single digit

* Example:

  * `38 → 3+8 = 11`
  * `11 → 1+1 = 2`
---------------------------
**Problem #:** **263**
**Language:** **C**

### Hints:

* An ugly number can have only these prime factors:

  * `2`
  * `3`
  * `5`

* Repeatedly divide the number:

  ```c
  while(n % 2 == 0)
      n = n / 2;
  ```

* Do the same for:

  * `3`
  * `5`

* If final value becomes `1`, return `true`

* Otherwise return `false`

* Also check:
  `n > 0`
-----------------------
**Problem #:** **14**
**Language:** **C**

### Hints:

* Compare characters column by column
* Take first string as reference
* For each character:

  * compare with same position in all strings
* If mismatch occurs or string ends:

  * stop the process
* Store matching characters in result string

### Hint (Returning String in C):

```c id="uw3k8f"
char* result = (char*)malloc(201 * sizeof(char));
```
-----------------------
**Problem #:** **125**
**Language:** **C**

### Hints:

* Use two pointers:

  * one from start
  * one from end

* Ignore:

  * spaces
  * symbols
  * special characters

* Convert uppercase letters to lowercase before comparing

* If characters do not match, return `false`

* Continue until pointers cross each other
-----------------------------
**Problem #:** **344**
**Language:** **C**

### Hints:

* Use two pointers:

  * one from start
  * one from end

* Swap characters at both positions

* Move pointers toward center

* Continue until pointers meet
---------------------------
**Problem #:** **557**
**Language:** **C**

### Hints:

* Traverse the string word by word

* Find:

  * start index of word
  * end index of word

* Reverse characters only within that word

* Keep spaces unchanged

* Repeat for all words in the sentence

### Hint (Returning String in C):

```c
char* result = (char*)malloc((strlen(s) + 1) * sizeof(char));
```
---------------------
**Problem #:** **387**
**Language:** **C**

### Hints:

* Count frequency of each character
* Use an array of size `26` for lowercase letters
* Traverse string again
* Find first character whose count is `1`
* Return its index
* If no unique character exists, return `-1`
---------------------
**Problem #:** **242**
**Language:** **C**

### Hints:

* If string lengths are different, return `false`
* Count frequency of characters from first string
* Decrease frequency using second string
* If all counts become `0`, strings are anagrams

```c id="f3k92m"
int freq[26] = {0};
```
---------------------
**Problem #:** **205**
**Language:** **C**

### Hints:

* Characters from first string should always map to same character in second string
* Compare characters position by position
* Store character mappings using arrays
* If mapping conflicts, return `false`
* If all mappings are valid, return `true`

```c id="d9k31x"
char map1[256] = {0};
char map2[256] = {0};
```
----------------------
**Problem #:** **290**
**Language:** **C**

### Hints:

* Split the sentence word by word
* Each pattern character should map to only one word
* Each word should also map to only one pattern character
* If mapping conflicts, return `false`
* If all mappings are valid, return `true`
-------------------------------
**Problem #:** **383**
**Language:** **C**

### Hints:

* Count frequency of characters in `magazine`

* Traverse `ransomNote`

* For each character:

  * reduce its count
  * if count becomes negative, return `false`

* If all characters are available, return `true`

```c id="m8k2qp"
int freq[26] = {0};
```
-----------------------
**Problem #:** **58**
**Language:** **C**

### Hints:

* Start traversing from the end of the string
* Ignore trailing spaces first
* Count characters until next space or start of string
* Return the count of the last word
---------------------------
**Problem #:** **28**
**Language:** **C**

### Hints:

* Traverse `haystack`
* Compare characters with `needle`
* If all characters match, return starting index
* If no match found, return `-1`
--------------------
**Problem #:** **67**
**Language:** **C**

### Hints:

* Traverse both strings from the end
* Add digits along with carry
* Store result from back to front
* If carry remains, add it

### Hint (Returning String in C):

```c id="n5r2ka"
char* result = (char*)malloc((maxLen + 2) * sizeof(char));
```
---------------------
**Problem #:** **415**
**Language:** **C**

### Hints:

* Traverse both strings from the end
* Add digits with carry
* Store result from back to front
* Reverse the final string if needed

### Hint (Returning String in C):

```c id="t8m1vx"
char* result = (char*)malloc((maxLen + 2) * sizeof(char));
```
--------------------
**Problem #:** **338**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc((n + 1) * sizeof(int));

*returnSize = n + 1;
return result;
```
--------------------
**Problem #:** **496**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc(nums1Size * sizeof(int));

*returnSize = nums1Size;
return result;
```
--------------------
**Problem #:** **1047**
**Language:** **C**

### Hint (Returning String in C):

```c
char* result = (char*)malloc((sSize + 1) * sizeof(char));
```
--------------------
**Problem #:** **1544**
**Language:** **C**

### Hint (Returning String in C):

```c
char* result = (char*)malloc((sSize + 1) * sizeof(char));
```
--------------------
**Problem #:** **94**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc(100 * sizeof(int));
int count = 0;

/* add during traversal: result[count++] = node->val; */

*returnSize = count;
return result;
```
--------------------
**Problem #:** **144**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc(100 * sizeof(int));
int count = 0;

/* add during traversal: result[count++] = node->val; */

*returnSize = count;
return result;
```
--------------------
**Problem #:** **145**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc(100 * sizeof(int));
int count = 0;

/* add during traversal: result[count++] = node->val; */

*returnSize = count;
return result;
```
--------------------
**Problem #:** **257**
**Language:** **C**

### Hint (Returning Array of Strings in C):

```c
char** result = (char**)malloc(300 * sizeof(char*));
*returnSize = 0;

/* for each path found: */
result[*returnSize] = (char*)malloc(300 * sizeof(char));
(*returnSize)++;
```
--------------------
**Problem #:** **501**
**Language:** **C**

### Hint (Returning Array in C):

```c
/* First pass: find the maximum frequency (maxCount) */
/* Second pass: collect all values with that frequency */

int* result = (int*)malloc(count * sizeof(int));

*returnSize = count;
return result;
```
--------------------
**Problem #:** **119**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc((rowIndex + 1) * sizeof(int));

*returnSize = rowIndex + 1;
return result;
```
--------------------
**Problem #:** **118**
**Language:** **C**

### Hint (Returning 2D Array in C):

```c
int** result = (int**)malloc(numRows * sizeof(int*));
*returnSize = numRows;
*returnColumnSizes = (int*)malloc(numRows * sizeof(int));

/* for each row i: */
result[i] = (int*)malloc((i + 1) * sizeof(int));
(*returnColumnSizes)[i] = i + 1;
```
--------------------
**Problem #:** **448**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc(numsSize * sizeof(int));
int count = 0;

/* add missing numbers: result[count++] = i + 1; */

*returnSize = count;
return result;
```
--------------------
**Problem #:** **349**
**Language:** **C**

### Hint (Returning Array in C):

```c
int* result = (int*)malloc(nums1Size * sizeof(int));
int count = 0;

/* add common elements: result[count++] = nums1[i]; */

*returnSize = count;
return result;
```
