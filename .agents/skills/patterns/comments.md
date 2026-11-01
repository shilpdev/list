# Comments

## Purpose

Keep code comments useful. A comment carries what the code cannot say by itself: the reasoning behind it and the use case it serves.

## Rules

1. Use a multiline comment when the comment is longer than one line.
   - **Why:** one long line forces horizontal scrolling and is hard to review in diffs.

   ```ts
   // Bad
   // Orders placed before the cutoff ship the same day, otherwise they move to the next business day and the customer is told so in the confirmation email.

   // Good
   /*
    * Orders placed before the cutoff ship the same day, otherwise they
    * move to the next business day and the customer is told so in the
    * confirmation email.
    */
   ```

2. Do not explain the code. Write why a condition or block exists, or what it does in terms of the use case.
   - **Why:** the code already says what it does; it never says why it is there.

   ```ts
   // Bad: repeats the code
   // Check if the user is an admin and the plan is free
   if (user.role === "admin" && plan === "free") {
   }

   // Good: gives the use case
   // Admins on the free plan are the account owners who signed up
   // but never invited a team, so we show them the invite prompt.
   if (user.role === "admin" && plan === "free") {
   }
   ```

3. Do not describe a variable, function or parameter whose name is already self-explanatory.
   - **Why:** the comment adds noise and goes stale when the name changes.

   ```ts
   // Bad
   // Total price of the cart
   const cartTotalPrice = getCartTotal();

   // Good: the name is enough, no comment
   const cartTotalPrice = getCartTotal();
   ```

   Comment a name only when it hides something the name cannot carry, such as a unit, a format or a special value.

   ```ts
   // Seconds, not milliseconds: the API rejects larger values.
   const timeout = 30;
   ```

4. Explain with an example wherever possible.
   - **Why:** one concrete input and output makes a rule easier to understand than a general description.

   ```ts
   /*
    * Strip the country code so the number matches what we store.
    * Example: "+91 98765 43210" -> "9876543210"
    */
   const localNumber = normalizePhone(rawNumber);
   ```
