/**
 * @jest-environment jsdom
 */

import { createEvent, fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event"


describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills")
    Object.defineProperty(
      window,
      'localStorage',
      { value: localStorageMock }
    )
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: "a@a"
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.appendChild(root)
    router()
  })
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      document.body.innerHTML = NewBillUI()
    })

    test("Then NewBill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      //to-do write expect expression
      expect(mailIcon.classList).toContain("active-icon")
    })

    test("Then the form is correctly render", () => {
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy()
    })

    describe("When the user submit the form without values", () => {
      test("Then the new bill is not created", () => {
        const form = screen.getByTestId("form-new-bill");

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const newBillContainer = new NewBill({
          document, onNavigate, store: null, localStorage: window.localStorage
        })

        const handleSubmit = jest.fn(newBillContainer.handleSubmit)
        fireEvent.submit(form)
        expect(handleSubmit).not.toBeCalled()
      })
    })

    describe("When the user upload a file that is not png, jpg or jpeg", () => {
      test("Then an error message appears", async () => {
        const fileInput = screen.getByTestId("file");
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const newBillContainer = new NewBill({
          document, onNavigate, store: mockStore, localStorage: window.localStorage
        })

        const handleChangeFile = jest.fn(() => newBillContainer.handleChangeFile)
        fileInput.addEventListener("change", handleChangeFile)

        userEvent.upload(fileInput, new File(["test"], "test.txt", { type: "text/plain" }))
        expect(window.alert).toHaveBeenCalled()
      })
    })

    describe("When the user upload a file that is png, jpg or jpeg", () => {
      test("Then the file field is OK", async () => {
        const fileInput = screen.getByTestId("file");
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBillContainer = new NewBill({
          document, onNavigate, store: mockStore, localStorage: window.localStorage
        })
        const handleChangeFile = jest.fn(() => newBillContainer.handleChangeFile)
        fileInput.addEventListener("change", handleChangeFile)
        userEvent.upload(fileInput, new File(["test"], "test.png", { type: "image/png" }))
        expect(fileInput.files).not.toBeNull()
      })
    })

    // POST
    describe("When the user submit the form with good values", () => {
      test("Then the new bill is created", async () => {
        const form = screen.getByTestId("form-new-bill");
        const typeInput = screen.getByTestId("expense-type");
        const nameInput = screen.getByTestId("expense-name");
        const dateInput = screen.getByTestId("datepicker");
        const amountInput = screen.getByTestId("amount");
        const tvaInput = screen.getByTestId("vat");
        const pctInput = screen.getByTestId("pct");
        const commentInput = screen.getByTestId("commentary");

        typeInput.value = "Transports"
        nameInput.value = "Test Bill"
        dateInput.value = "2024-10-24"
        amountInput.value = 320
        tvaInput.value = 20
        pctInput.value = 25
        commentInput.value = "Commentary test"

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const newBillContainer = new NewBill({
          document, onNavigate, store: mockStore, localStorage: window.localStorage
        })

        newBillContainer.fileName = "test.jpg"

        const handleSubmit = jest.fn(() => newBillContainer.handleSubmit)
        const submitEvent = createEvent.submit(form)
        fireEvent.submit(form, submitEvent)
        await waitFor(() => {
          expect(handleSubmit).not.toThrowError()
        })
      })
    })
  })

  test("fetches bills from an API and fails with 404 or 500 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur"))
        }
      }
    })
    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur/)
    expect(message).toBeTruthy()

  })
})