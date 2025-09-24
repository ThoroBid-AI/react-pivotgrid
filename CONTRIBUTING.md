# Contributing to React PivotGrid

Thank you for your interest in contributing to React PivotGrid! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/react-pivotgrid.git
   cd react-pivotgrid
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Install dependencies for examples and docs:
   ```bash
   cd examples && npm install && cd ..
   cd docs && npm install && cd ..
   ```

## Development Workflow

### Running the Development Environment

```bash
# Start the library in development mode
npm run dev

# Start the example app (in a separate terminal)
npm run example

# Start the documentation site (in a separate terminal)
npm run docs:dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint the code
npm run lint

# Fix linting issues
npm run lint:fix

# Format the code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

## Making Changes

### Branching Strategy

- Create feature branches from `main`
- Use descriptive branch names: `feature/pivot-configuration`, `fix/aggregation-bug`, etc.
- Keep branches focused on a single feature or fix

### Commit Guidelines

We follow conventional commits for clear and consistent commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(pivot): add drag and drop configuration
fix(aggregation): handle null values in sum function
docs(readme): update installation instructions
test(utils): add tests for pivot data transformation
```

### Code Standards

- Follow the existing code style and conventions
- Write TypeScript for all new code
- Add JSDoc comments for public APIs
- Ensure all exports are properly typed
- Write tests for new functionality
- Update documentation for user-facing changes

### Testing Requirements

- All new features must include tests
- Bug fixes should include regression tests
- Aim for high test coverage (>90%)
- Test both happy path and edge cases

### Documentation

- Update README.md for new features
- Add examples for complex functionality
- Update TypeScript definitions
- Add Docusaurus documentation for major features

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- React PivotGrid version
- React version
- Browser and version (if applicable)
- Minimal reproduction example
- Expected vs actual behavior
- Error messages and stack traces

### Feature Requests

For feature requests, please provide:

- Clear description of the feature
- Use cases and motivation
- Proposed API (if applicable)
- Examples of similar features in other libraries

## Pull Request Process

1. **Create an Issue**: For significant changes, create an issue first to discuss the approach

2. **Fork and Branch**: Fork the repository and create a feature branch

3. **Develop**: Make your changes following the guidelines above

4. **Test**: Ensure all tests pass and add new tests as needed

5. **Document**: Update documentation and examples as needed

6. **Submit PR**: Create a pull request with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Breaking change notes (if any)

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code follows style guidelines (`npm run lint`)
- [ ] Code is properly formatted (`npm run format:check`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Documentation is updated
- [ ] Examples work with changes
- [ ] Breaking changes are documented

## Project Structure

```
react-pivotgrid/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── index.ts           # Main export file
├── tests/                  # Test files
│   ├── components/        # Component tests
│   ├── hooks/             # Hook tests
│   ├── utils/             # Utility tests
│   └── setup.ts           # Test setup
├── examples/              # Example applications
├── docs/                  # Documentation (Docusaurus)
├── dist/                  # Built library (generated)
└── coverage/              # Test coverage reports (generated)
```

## Code Review Guidelines

### For Contributors

- Keep PRs focused and reasonably sized
- Provide clear commit messages and PR descriptions
- Respond to feedback promptly and professionally
- Update your branch if conflicts arise

### For Reviewers

- Be constructive and respectful in feedback
- Focus on code quality, performance, and maintainability
- Check for proper testing and documentation
- Verify that examples and documentation work correctly

## Getting Help

- Check existing issues and discussions
- Join our community discussions on GitHub
- Ask questions in pull request comments
- Reach out to maintainers for complex architectural decisions

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different opinions and approaches

## Recognition

Contributors will be:
- Listed in the README.md contributors section
- Mentioned in release notes for significant contributions
- Invited to join the maintainers team for consistent, high-quality contributions

Thank you for contributing to React PivotGrid!